import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/entities/user.entity';
import * as hbs from 'handlebars';
import { join } from 'path';
import { readFileSync } from 'fs';
import { createTransport, Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private templates: Record<string, hbs.TemplateDelegate>;
  private readonly templateDir: string;

  constructor(private readonly configService: ConfigService) {
    // Initialize transporter
    this.transporter = createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT') || 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USERNAME'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });

    // Set template directory based on environment
    this.templateDir = process.env.NODE_ENV === 'production'
      ? join(process.cwd(), 'dist', 'templates', 'email')
      : join(process.cwd(), 'src', 'templates', 'email');

    // Initialize templates
    this.templates = this.loadTemplates();
  }

  /**
   * Load all email templates from the templates directory
   */
  private loadTemplates(): Record<string, hbs.TemplateDelegate> {
    const templateNames = [
      'otp-email',
      'verification-email',
      'password-reset-email'
    ];

    const templates: Record<string, hbs.TemplateDelegate> = {};

    // First, load the base template
    try {
      const baseTemplatePath = join(this.templateDir, 'base.hbs');
      const baseTemplateSource = readFileSync(baseTemplatePath, 'utf8');
      hbs.registerPartial('base', baseTemplateSource);
    } catch (error) {
      console.error('Failed to load base template:', error);
    }

    // Then load all other templates
    for (const name of templateNames) {
      try {
        const templatePath = join(this.templateDir, `${name}.hbs`);
        const templateSource = readFileSync(templatePath, 'utf8');
        templates[name] = hbs.compile(templateSource);
      } catch (error) {
        console.error(`Failed to load template ${name}:`, error);
        // Create a fallback template for missing templates
        templates[name] = hbs.compile(`
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>{{subject}}</h2>
            <p>{{message}}</p>
            <p>Best regards,<br>{{companyName}}</p>
          </div>
        `);
      }
    }

    return templates;
  }

  /**
   * Send OTP email
   */
  async sendOtpEmail(email: string, otp: string, username?: string): Promise<void> {
    const context = {
      username: username || 'User',
      otp,
      expiration: '5 minutes',
      email,
      currentYear: new Date().getFullYear(),
      companyName: this.configService.get<string>('APP_NAME') || 'Our Service',
    };

    await this.sendEmail({
      to: email,
      subject: 'Your One-Time Password (OTP)',
      template: 'otp-email',
      context,
    });
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(user: User, verifyLink: string): Promise<void> {
    const context = {
      username: user.username,
      verifyLink,
      expiration: '1 hour',
      email: user.email,
      currentYear: new Date().getFullYear(),
      companyName: this.configService.get<string>('APP_NAME') || 'Our Service',
    };

    await this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      template: 'verification-email',
      context,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: User, resetLink: string): Promise<void> {
    const context = {
      username: user.username,
      resetLink,
      expiration: '1 hour',
      email: user.email,
      currentYear: new Date().getFullYear(),
      companyName: this.configService.get<string>('APP_NAME') || 'Our Service',
    };

    await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset-email',
      context,
    });
  }

  /**
   * Generic email sending method
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    const { to, subject, template, context } = options;

    // Get the compiled template
    const compiledTemplate = this.templates[template];
    if (!compiledTemplate) {
      throw new Error(`Template ${template} not found`);
    }

    // Generate HTML from template
    const html = compiledTemplate({
      ...context,
      appName: this.configService.get<string>('APP_NAME'),
      supportEmail: this.configService.get<string>('SUPPORT_EMAIL'),
    });

    // Generate plain text version (simple fallback)
    const text = this.generatePlainText(html);

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM_ADDRESS'),
        to,
        subject,
        text,
        html,
      });
      console.log('Message sent:', info.messageId);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Generate a plain text version from HTML (basic implementation)
   */
  private generatePlainText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<style[^>]*>.*<\/style>/gm, '')
      .replace(/<script[^>]*>.*<\/script>/gm, '')
      .replace(/<[^>]+>/gm, '')
      .replace(/\n{2,}/gm, '\n\n')
      .trim();
  }
}