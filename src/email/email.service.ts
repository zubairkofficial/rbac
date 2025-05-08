import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User } from 'src/users/entities/user.entity';
import * as hbs from 'handlebars';
import { join } from 'path';
import { readFileSync } from 'fs';
interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  template: 'otp' | 'verification' | 'password-reset' | 'custom';
  templateData: {
    username?: string;
    otp?: string;
    actionUrl?: string;
    actionText?: string;
    title?: string;
    subtitle?: string;
    message?: string;
    footer?: string;
    [key: string]: any; // Allow additional custom properties
  };
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
    textSecondary?: string;
  };
}

@Injectable()
export class EmailService {
  private transporter;

  // Default color scheme
  private defaultColors = {
    primary: '#f59e0b', // Amber-500
    secondary: '#fbbf24', // Amber-400
    background: '#f8f8f8',
    text: '#031a2e', // Dark blue
    textSecondary: '#666666',
  };

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT') || 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USERNAME'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  /**
   * Send OTP email
   */
  async sendOtpEmail(email: string, otp: string, username?: string) {
    // return this.sendEmail({
    //   to: email,
    //   subject: 'Your OTP Code',
    //   text: `Your OTP code is: ${otp}`,
    //   template: 'otp',
    //   templateData: {
    //     username: username || 'user',
    //     otp,
    //     title: 'Your OTP Code',
    //     message: 'Please use the following OTP code to verify your identity.',
    //     footer: 'This code will expire in 5 minutes.',
    //   },
    // });
    const templatePath = join(__dirname, 'templates', 'otp-email.hbs');
    const template = readFileSync(templatePath, 'utf-8');
    const compiledTemplate = hbs.create().compile(template);

    return compiledTemplate({
      username,
      otp,
      expiration:new Date(),
      email,
      currentYear: new Date().getFullYear(),
      companyName: 'Your Company Name',
    });
 
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(user: User, verifyLink: string) {
    return this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      text: `Hello ${user.username},\n\nPlease verify your email by clicking this link: ${verifyLink}\n\nThis link will expire in 1 hour.`,
      template: 'verification',
      templateData: {
        username: user.username,
        actionUrl: verifyLink,
        actionText: 'Verify Your Email',
        title: 'Welcome to MyApp!',
        message: 'Thank you for signing up. Please verify your email address by clicking the button below.',
        footer: 'This link will expire in 1 hour.',
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: User, resetLink: string) {
    return this.sendEmail({
      to: user.email,
      subject: 'Reset Your Password',
      text: `Hello ${user.username},\n\nPlease reset your password by clicking this link: ${resetLink}\n\nThis link will expire in 1 hour.`,
      template: 'password-reset',
      templateData: {
        username: user.username,
        actionUrl: resetLink,
        actionText: 'Reset Your Password',
        title: 'Password Reset Request',
        message: 'We received a request to reset your password. You can reset your password by clicking the button below:',
        footer: 'This link will expire in 1 hour.',
      },
    });
  }

  /**
   * Generic email sending method with template support
   */
  async sendEmail(options: EmailOptions) {
    const { to, subject, text, template, templateData, colors = {} } = options;
    
    // Merge custom colors with defaults
    const mergedColors = { ...this.defaultColors, ...colors };

    let html: string;
    
    switch (template) {
      case 'otp':
        html = this.generateOtpTemplate(templateData, mergedColors);
        break;
      case 'verification':
        html = this.generateVerificationTemplate(templateData, mergedColors);
        break;
      case 'password-reset':
        case 'password-reset':
        html = this.generatePasswordResetTemplate(templateData, mergedColors);
        break;
      default:
        html = this.generateCustomTemplate(templateData, mergedColors);
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM_ADDRESS'),
        to,
        subject,
        text,
        html,
      });
      console.log('Message sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Error sending email');
    }
  }

  /**
   * Template generators
   */
  private generateBaseTemplate(content: string, colors: any): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Email</title>
          <style>
            body, table, td, a {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
            table, td {
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
            img {
              -ms-interpolation-mode: bicubic;
            }
            @media screen and (max-width: 600px) {
              .container {
                width: 100% !important;
                padding: 10px !important;
              }
              .button {
                width: 100% !important;
                padding: 15px !important;
                display: block !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: ${colors.background};">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                  ${content}
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private generateOtpTemplate(data: any, colors: any): string {
    const content = `
      <tr>
        <td align="center" style="padding: 20px;">
          <h1 style="color: ${colors.text}; font-family: Arial, sans-serif; margin: 0;">${data.title || 'Your OTP Code'}</h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 0 20px 20px 20px;">
          <p style="color: ${colors.textSecondary}; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
            Hi <strong>${data.username}</strong>,
          </p>
          <p style="color: ${colors.textSecondary}; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
            ${data.message || 'Please use the following OTP code to verify your identity.'}
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 0 20px 20px 20px;">
          <div style="background: ${colors.background}; border-radius: 4px; padding: 15px 20px; display: inline-block;">
            <span style="color: ${colors.text}; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
              ${data.otp}
            </span>
          </div>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 0 20px 20px 20px;">
          <p style="color: ${colors.textSecondary}; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
            ${data.footer || 'This code will expire in 5 minutes.'}
          </p>
        </td>
      </tr>
    `;
    return this.generateBaseTemplate(content, colors);
  }

  private generateVerificationTemplate(data: any, colors: any): string {
    const content = `
      <tr>
        <td align="center" style="padding: 20px;">
          <h1 style="color: ${colors.text}; font-family: Arial, sans-serif; margin: 0;">Welcome, <strong>${data.username}</strong>!</h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 0 20px 20px 20px;">
          <p style="color: ${colors.textSecondary}; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
            ${data.message || 'Thank you for signing up. Please verify your email address by clicking the button below.'}
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom: 20px;">
          <a href="${data.actionUrl}" class="button" style="background: linear-gradient(180deg, ${colors.secondary}, ${colors.primary}); color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: bold; padding: 15px 20px; display: inline-block;">
            ${data.actionText || 'Verify Your Email'}
          </a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 0 20px 20px 20px;">
          <p style="color: ${colors.textSecondary}; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
            ${data.footer || 'This link will expire in 1 hour.'}
          </p>
        </td>
      </tr>
    `;
    return this.generateBaseTemplate(content, colors);
  }

  private generatePasswordResetTemplate(data: any, colors: any): string {
    const content = `
      <tr>
        <td align="center" style="padding: 20px;">
          <h1 style="color: ${colors.text}; font-family: Arial, sans-serif; margin: 0;">${data.title || 'Password Reset Request'}</h1>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 0 20px 20px 20px;">
          <p style="color: ${colors.textSecondary}; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
            Hi <strong>${data.username}</strong>,
          </p>
          <p style="color: ${colors.textSecondary}; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
            ${data.message || 'We received a request to reset your password. You can reset your password by clicking the button below:'}
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom: 20px;">
          <a href="${data.actionUrl}" class="button" style="background: linear-gradient(180deg, ${colors.secondary}, ${colors.primary}); color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: bold; padding: 15px 20px; display: inline-block;">
            ${data.actionText || 'Reset Your Password'}
          </a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 0 20px 20px 20px;">
          <p style="color: ${colors.textSecondary}; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
            ${data.footer || 'This link will expire in 1 hour.'}
          </p>
        </td>
      </tr>
    `;
    return this.generateBaseTemplate(content, colors);
  }

  private generateCustomTemplate(data: any, colors: any): string {
    // You can extend this with more customizable sections as needed
    let content = `
      <tr>
        <td align="center" style="padding: 20px;">
          <h1 style="color: ${colors.text}; font-family: Arial, sans-serif; margin: 0;">
            ${data.title || 'Hello ' + (data.username || '')}
          </h1>
        </td>
      </tr>
    `;

    if (data.subtitle) {
      content += `
        <tr>
          <td align="center" style="padding: 0 20px 20px 20px;">
            <h2 style="color: ${colors.text}; font-family: Arial, sans-serif; margin: 0;">
              ${data.subtitle}
            </h2>
          </td>
        </tr>
      `;
    }

    if (data.message) {
      content += `
        <tr>
          <td align="center" style="padding: 0 20px 20px 20px;">
            <p style="color: ${colors.textSecondary}; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
              ${data.message}
            </p>
          </td>
        </tr>
      `;
    }

    if (data.actionUrl && data.actionText) {
      content += `
        <tr>
          <td align="center" style="padding-bottom: 20px;">
            <a href="${data.actionUrl}" class="button" style="background: linear-gradient(180deg, ${colors.secondary}, ${colors.primary}); color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: bold; padding: 15px 20px; display: inline-block;">
              ${data.actionText}
            </a>
          </td>
        </tr>
      `;
    }

    if (data.footer) {
      content += `
        <tr>
          <td align="center" style="padding: 0 20px 20px 20px;">
            <p style="color: ${colors.textSecondary}; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
              ${data.footer}
            </p>
          </td>
        </tr>
      `;
    }

    return this.generateBaseTemplate(content, colors);
  }
}