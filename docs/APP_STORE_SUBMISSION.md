# App Store Connect Submission Guide

This guide walks you through submitting your app to App Store Connect for review.

## Pre-Submission Checklist

### 1. ✅ Code is Ready
- [x] Reviewer login system implemented
- [x] All changes committed to git
- [ ] Reviewer account created in Supabase (see below)

### 2. Create Reviewer Account in Supabase
**IMPORTANT: Do this before submitting!**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **"Add User"** → **"Create new user"**
5. Fill in:
   - **Email**: `reviewer@connectos.app`
   - **Password**: `SomethingStrong123!`
   - ✅ Check **"Auto Confirm User"**
6. Click **"Create User"**

### 3. Build and Archive in Xcode

1. **Open Xcode:**
   ```bash
   open ios/App/App.xcworkspace
   ```
   (Note: Use `.xcworkspace`, not `.xcodeproj`)

2. **Select a Device:**
   - In Xcode, select **"Any iOS Device (arm64)"** from the device dropdown (top toolbar)
   - Do NOT select a simulator

3. **Archive the App:**
   - Go to **Product** → **Archive**
   - Wait for the build to complete (this may take a few minutes)
   - The Organizer window will open automatically when done

4. **If Archive is Grayed Out:**
   - Make sure you selected "Any iOS Device" (not a simulator)
   - Clean build folder: **Product** → **Clean Build Folder** (Shift+Cmd+K)
   - Try again

### 4. Upload to App Store Connect

1. **In Xcode Organizer:**
   - Select your archive
   - Click **"Distribute App"**

2. **Distribution Method:**
   - Select **"App Store Connect"**
   - Click **"Next"**

3. **Distribution Options:**
   - Select **"Upload"**
   - Click **"Next"**

4. **App Thinning:**
   - Select **"All compatible device variants"** (recommended)
   - Click **"Next"**

5. **Signing:**
   - Select **"Automatically manage signing"** (if available)
   - Or use your existing provisioning profile
   - Click **"Next"**

6. **Review:**
   - Review the summary
   - Click **"Upload"**

7. **Wait for Upload:**
   - The upload may take 10-30 minutes depending on your connection
   - You'll see a progress bar

### 5. Submit for Review in App Store Connect

1. **Go to App Store Connect:**
   - Visit [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Sign in with your Apple Developer account

2. **Navigate to Your App:**
   - Go to **"My Apps"**
   - Select your app (ConnectOS)

3. **Wait for Processing:**
   - After upload, Apple processes your build (usually 30-60 minutes)
   - You'll see a yellow "Processing" status
   - Wait until it shows "Ready to Submit"

4. **Select Build:**
   - Go to the **"App Store"** tab
   - Scroll to **"Build"** section
   - Click **"+ Build"** and select your uploaded build

5. **Fill Out App Information:**
   - Complete all required fields:
     - Screenshots
     - Description
     - Keywords
     - Support URL
     - Privacy Policy URL
     - Category
     - Age Rating
     - etc.

6. **Add Reviewer Notes (IMPORTANT):**
   - Scroll to **"App Review Information"**
   - In **"Notes"**, add:
     ```
     For App Review:
     - On the initial screen, simply click the "Apple Reviewer Login" button (🍎 icon)
     - This will automatically sign you in - no password required
     - This bypasses the OTP verification for review purposes
     ```

7. **Submit for Review:**
   - Click **"Submit for Review"** (top right)
   - Confirm submission

## Post-Submission

### What Happens Next:
1. **App Review** (usually 24-48 hours)
   - Apple reviewers will test your app
   - They'll use the reviewer login credentials you provided

2. **Possible Outcomes:**
   - ✅ **Approved**: App goes live!
   - ⚠️ **Rejected**: You'll get feedback and can resubmit
   - 📝 **More Information Needed**: Respond to questions

3. **After Approval:**
   - Follow the steps in `docs/REVIEWER_SYSTEM_REMOVAL.md` to remove the reviewer system
   - Deploy your production build

## Troubleshooting

### Build Errors:
- **"No signing certificate"**: Make sure you're logged into Xcode with your Apple Developer account
- **"Provisioning profile issues"**: Check your Apple Developer account has the correct certificates
- **"Archive button grayed out"**: Make sure you selected "Any iOS Device", not a simulator

### Upload Errors:
- **"Invalid bundle"**: Check your bundle identifier matches App Store Connect
- **"Missing required icon"**: Make sure app icons are set in Xcode
- **"Code signing failed"**: Check your signing certificates in Xcode

### Common Issues:
- If the reviewer login page doesn't show: Check that `isReviewBuild()` is detecting the TestFlight environment correctly
- If upload fails: Try cleaning build folder and rebuilding

## Important Notes

⚠️ **Before Production Release:**
- Remove the reviewer system using `docs/REVIEWER_SYSTEM_REMOVAL.md`
- Delete the `reviewer@connectos.app` account from Supabase
- Test the normal login flow works correctly

✅ **The reviewer system only activates in:**
- TestFlight builds
- App Store Review builds
- Local development (for testing)

It will NOT activate for regular App Store users after approval.

