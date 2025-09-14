# Connect - Supabase Email Templates

This directory contains custom email templates for Connect's authentication system, providing a much cleaner and more professional appearance than the default Supabase templates.

## 📧 Email Templates Included

- **Confirmation** - Welcome email with verification code
- **Recovery** - Password reset with verification code  
- **Magic Link** - One-click login link
- **Invite** - User invitation to join Connect
- **Email Change** - Confirm new email address
- **Phone Change** - Confirm new phone number

## 🎨 Design Features

- **Modern Design**: Clean, professional layout with gradient headers
- **Brand Colors**: Each template uses a unique color scheme that matches Connect's branding
- **Responsive**: Mobile-friendly design that works on all devices
- **Security Focused**: Clear security notes and expiration warnings
- **Accessible**: High contrast colors and readable fonts
- **Professional**: Consistent branding and messaging

## 🚀 How to Apply These Templates

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**
3. For each template type:
   - Click on the template (e.g., "Confirm signup")
   - Replace the default HTML with the content from the corresponding file
   - Save the changes

### Option 2: Supabase CLI

1. Install Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Apply the configuration:
   ```bash
   supabase db push
   ```

### Option 3: Direct Database Update

If you have database access, you can update the email templates directly in the `auth.config` table.

## 🎯 Template Variables

Each template uses Supabase's built-in variables:

- `{{ .Token }}` - The verification code
- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .Email }}` - The user's email address
- `{{ .SiteURL }}` - Your site's URL

## 🔧 Customization

To customize these templates for your specific needs:

1. **Colors**: Update the gradient colors in the CSS
2. **Logo**: Replace "Connect" with your brand name
3. **Content**: Modify the text to match your brand voice
4. **Links**: Update the footer links to point to your help pages

## 📱 Mobile Optimization

All templates are fully responsive and include:
- Mobile-first CSS design
- Touch-friendly button sizes
- Readable font sizes on small screens
- Proper spacing and padding

## 🔒 Security Features

Each template includes:
- Clear expiration warnings
- Security notes about not sharing codes
- Instructions for what to do if the user didn't request the action
- Professional footer with help links

## 🎨 Color Schemes

- **Confirmation**: Orange gradient (#f97316 → #ea580c)
- **Recovery**: Red gradient (#dc2626 → #b91c1c)  
- **Magic Link**: Purple gradient (#7c3aed → #5b21b6)
- **Invite**: Green gradient (#059669 → #047857)
- **Email Change**: Blue gradient (#2563eb → #1d4ed8)
- **Phone Change**: Cyan gradient (#0891b2 → #0e7490)

## 📞 Support

If you need help implementing these templates or have questions about customization, please refer to the Supabase documentation or contact the development team.

---

**Note**: These templates are designed specifically for Connect and may need adjustments for other projects. Always test email templates in a development environment before deploying to production.
