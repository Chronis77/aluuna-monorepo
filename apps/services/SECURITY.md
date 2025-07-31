# Security Checklist for Aluuna TTS Server

## ✅ Security Measures Implemented

### 1. API Key Authentication
- [x] All TTS endpoints require valid API key
- [x] API keys are stored as environment variables
- [x] Different keys for development and production
- [x] Keys are never committed to version control

### 2. Google Cloud Credentials
- [x] Credentials stored as environment variables in Vercel
- [x] `google-creds.json` is in `.gitignore`
- [x] No hardcoded credentials in source code
- [x] Service account has minimal required permissions

### 3. Repository Security
- [x] `.gitignore` excludes sensitive files from Git
- [x] `.vercelignore` excludes sensitive files from Vercel deployment
- [x] No API keys in committed files
- [x] No Google Cloud credentials in committed files
- [x] Generated audio files are excluded

### 4. Production Security
- [x] HTTPS enabled (Vercel handles SSL)
- [x] CORS configured for cross-origin requests
- [x] Environment variables properly set in Vercel
- [x] Serverless deployment (no persistent file system)

## 🔒 Security Best Practices

### For Developers
1. **Never commit sensitive data**
   - API keys
   - Google Cloud credentials
   - Database passwords
   - Private keys

2. **Use environment variables**
   ```bash
   export API_KEY=your-key-here
   export GOOGLE_CREDENTIALS='{"type":"service_account",...}'
   ```

3. **Test securely**
   ```bash
   # Use example files, not real data
   cp test-vercel.example.js test-vercel.js
   # Edit with your actual values
   ```

### For React Native Integration
1. **Store API keys securely**
   ```javascript
   // Use secure storage (not plain text)
   import * as SecureStore from 'expo-secure-store';
   
   const API_KEY = await SecureStore.getItemAsync('api_key');
   ```

2. **Validate responses**
   ```javascript
   if (response.status !== 200) {
     throw new Error('API request failed');
   }
   ```

3. **Handle errors gracefully**
   ```javascript
   try {
     const result = await fetch(url, options);
   } catch (error) {
     console.error('TTS Error:', error);
     // Show user-friendly error message
   }
   ```

## 🚨 Security Checklist Before Deployment

### Pre-Deployment
- [ ] No API keys in source code
- [ ] No Google Cloud credentials in source code
- [ ] All sensitive files in `.gitignore`
- [ ] Environment variables set in Vercel
- [ ] API key generated and secured

### Post-Deployment
- [ ] Test with environment variables
- [ ] Verify API key authentication works
- [ ] Check that unauthorized requests are rejected
- [ ] Confirm HTTPS is working
- [ ] Test CORS with your React Native app

## 🔄 Key Rotation

### When to Rotate Keys
- Every 90 days (recommended)
- After security incidents
- When team members leave
- When keys are compromised

### How to Rotate
1. Generate new API key: `node generate-api-key.js`
2. Update Vercel environment: `vercel env add API_KEY`
3. Update React Native app
4. Deploy: `vercel --prod`
5. Test new key
6. Remove old key from Vercel

## 📞 Security Contacts

If you discover a security vulnerability:
1. **DO NOT** create a public issue
2. **DO** contact the development team privately
3. **DO** include detailed reproduction steps
4. **DO** wait for acknowledgment before disclosure

## 🔍 Regular Security Audits

### Monthly Checks
- [ ] Review environment variables
- [ ] Check for exposed credentials
- [ ] Update dependencies
- [ ] Review access logs

### Quarterly Reviews
- [ ] Rotate API keys
- [ ] Audit Google Cloud permissions
- [ ] Review security documentation
- [ ] Update security checklist 