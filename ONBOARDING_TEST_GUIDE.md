# 🧪 Onboarding Testing Guide - Williams Diversified LLC

## 📋 Test Users Created

### 👤 Test Employee (John Smith)
- **Email**: `john.smith@williamsdiverse.com`
- **Password**: `Employee123!`
- **Status**: Needs onboarding
- **Login URL**: https://williams-portal.preview.emergentagent.com/auth

### 🏢 Test Vendor (ACME Construction LLC)
- **Company**: ACME Construction LLC
- **Email**: `contact@acmeconstruction.com`
- **Invitation Code**: `VENDOR2025`
- **Direct Onboarding URL**: https://williams-portal.preview.emergentagent.com/vendor-onboarding?code=VENDOR2025

---

## 🧪 EMPLOYEE ONBOARDING TEST

### Step 1: Login as Employee
1. Go to: https://williams-portal.preview.emergentagent.com/auth
2. Enter credentials:
   - **Username**: `john.smith@williamsdiverse.com`
   - **Password**: `Employee123!`
3. Click "Login"
4. **Expected**: Should automatically redirect to `/employee-onboarding` (because `onboarding_completed = false`)

### Step 2: Complete Onboarding Wizard

#### 📝 Step 1: Personal Information
Fill in sample data:
- **First Name**: John
- **Last Name**: Smith
- **Email**: john.smith@williamsdiverse.com
- **Phone**: (918) 555-1234
- **Address**: 123 Main Street
- **City**: Tulsa
- **State**: OK
- **ZIP**: 74103
- **SSN**: 123-45-6789 (test data)
- **Date of Birth**: 01/15/1985

**Click "Next"**

#### 💼 Step 2: Employment Details
- **Job Title**: Electrician
- **Department**: Construction
- **Start Date**: (Today's date)
- **Classification**: electrician
- **Hourly Rate**: 35.00
- ☑️ **Davis-Bacon Certified** (optional)

**Click "Next"**

#### 📄 Step 3: W-4 Tax Information
- **Filing Status**: Single (or married_joint)
- **Dependents**: 2
- **Extra Withholding**: 50.00 (optional)

**Click "Next"**

#### 💳 Step 4: Direct Deposit
- **Bank Name**: First National Bank
- **Account Type**: Checking
- **Routing Number**: 123456789
- **Account Number**: 987654321

**Click "Next"**

#### ✍️ Step 5: Legal Documents (NDA)
- Read the NDA
- ☑️ Check "I have read and agree..."
- **Signature**: Type "John Smith"

**Click "Next"**

#### ✅ Step 6: Review & Submit
- Review all information
- **Click "Complete Onboarding"**

### Step 3: Verify Success
**Expected Results:**
- ✅ Success message appears
- ✅ Redirected to dashboard
- ✅ Can now access "My Payroll Documents" in sidebar
- ✅ New entry in `payroll_employees` collection
- ✅ W-4 info stored in `employee_tax_info` collection
- ✅ NDA stored in `legal_agreements` collection

---

## 🧪 VENDOR ONBOARDING TEST

### Step 1: Access Vendor Onboarding
**Option A - Direct Link (Recommended):**
1. Go to: https://williams-portal.preview.emergentagent.com/vendor-onboarding?code=VENDOR2025

**Option B - Test Invitation Email Flow:**
1. Login as admin
2. Go to "Vendor Management"
3. Click "Add Vendor"
4. Enter: ACME Construction LLC, contact@acmeconstruction.com, (555) 987-6543
5. Click "Send Invitation"
6. Copy invitation code from success message
7. Use the onboarding URL with that code

### Step 2: Complete Vendor Onboarding Wizard

#### 🏢 Step 1: Company Information
- **Company Name**: ACME Construction LLC
- **Business Type**: LLC
- **EIN**: 12-3456789
- **Phone**: (555) 987-6543
- **Email**: contact@acmeconstruction.com
- **Website**: https://www.acmeconstruction.com
- **Address**: 456 Commerce Drive
- **City**: Tulsa
- **State**: OK
- **ZIP**: 74104

**Click "Next"**

#### 👤 Step 2: Contact Person
- **First Name**: Robert
- **Last Name**: Johnson
- **Title**: Operations Manager
- **Email**: robert@acmeconstruction.com
- **Phone**: (555) 987-6544

**Click "Next"**

#### 🛡️ Step 3: Insurance & Licensing
- **Insurance Provider**: State Farm
- **Policy Number**: SF-123456789
- **Coverage Amount**: $2,000,000
- **Expiration Date**: 12/31/2025

**Click "Next"**

#### 💰 Step 4: Banking Information
- **Bank Name**: Tulsa Community Bank
- **Account Type**: Business Checking
- **Routing Number**: 103900036
- **Account Number**: 123456789012

**Click "Next"**

#### 📎 Step 5: Upload Documents
- **W-9 Form**: Upload a sample PDF (or create a blank PDF)
- **COI**: Upload a sample insurance certificate PDF
- **Business License**: (Optional) Upload PDF

**Note**: For testing, you can use any PDF file.

**Click "Next"**

#### ✍️ Step 6: Legal Agreements
- Read NDA
- ☑️ Check "I agree to the Non-Disclosure Agreement"
- ☑️ Check "I agree to vendor terms..."
- **Signature**: Type "Robert Johnson"

**Click "Next"**

#### ✅ Step 7: Review & Submit
- Review all information
- **Click "Complete Onboarding"**

### Step 3: Verify Success
**Expected Results:**
- ✅ Success message with temporary password
- ✅ Redirected to vendor portal
- ✅ Can login with: contact@acmeconstruction.com / TempPassword123!
- ✅ New vendor user created in `users` collection (role: vendor)
- ✅ Vendor profile in `vendors` collection (status: pending_approval)
- ✅ Documents uploaded to `/backend/vendor_documents/`
- ✅ Documents in `vendor_documents` collection (status: pending)
- ✅ NDA in `legal_agreements` collection
- ✅ Invitation marked as "completed" in `vendor_invitations` collection

---

## 🔍 Post-Onboarding Verification

### For Employee (John Smith):
1. **Login again** with john.smith@williamsdiverse.com
2. **Check sidebar**: Should see "My Payroll Documents"
3. **Navigate to**: `/my-payroll-documents`
4. **Expected**: Empty paystubs (will be populated by payroll runs)

### For Vendor (ACME Construction):
1. **Login** with contact@acmeconstruction.com / TempPassword123!
2. **Check sidebar**: Should see:
   - ✅ Vendor Portal
   - ✅ Company Documents
   - ✅ Contracts
   - ✅ Safety & Compliance
   - ❌ NO Timesheets
   - ❌ NO Fleet Inspections
3. **Navigate to**: `/company-documents`
4. **Expected**: See uploaded W-9, COI (status: pending)
5. **Navigate to**: `/vendors`
6. **Expected**: See vendor dashboard with invoice submission

### Admin Verification:
1. **Login as admin**
2. **Go to**: Payroll Management
3. **Expected**: See John Smith in employee list
4. **Go to**: Vendor Management
5. **Expected**: See ACME Construction LLC
6. **Click vendor** → View documents
7. **Approve/reject** vendor documents

---

## 🧪 Additional Test Scenarios

### Test Employee without Onboarding Complete:
- Any employee with `onboarding_completed: false` should be redirected to onboarding

### Test Vendor with Invalid Code:
- Try: `/vendor-onboarding?code=INVALID123`
- **Expected**: Error message "Invalid invitation code"

### Test AI Assist Button:
- During onboarding, click "AI Assist" button
- **Note**: Currently returns empty suggestions (AI integration placeholder)

### Test Navigation Restrictions:
- Login as vendor
- Try accessing `/timesheets` or `/fleet`
- **Expected**: Should not see these in navigation

---

## 📊 Database Verification

After completing both onboardings, verify in MongoDB:

```javascript
// Employee data
db.users.findOne({email: "john.smith@williamsdiverse.com"})
db.payroll_employees.findOne({email: "john.smith@williamsdiverse.com"})
db.employee_tax_info.findOne({employee_id: "<john's user id>"})
db.legal_agreements.findOne({user_id: "<john's user id>"})

// Vendor data
db.users.findOne({email: "contact@acmeconstruction.com"})
db.vendors.findOne({email: "contact@acmeconstruction.com"})
db.vendor_documents.find({vendor_id: "<vendor id>"})
db.legal_agreements.findOne({vendor_id: "<vendor id>"})
db.vendor_invitations.findOne({invitation_code: "VENDOR2025"})
```

---

## 🎯 Success Criteria

### Employee Onboarding Success:
- ✅ User can login
- ✅ Automatically redirected to onboarding
- ✅ Can complete all 6 steps
- ✅ Data saved to all collections
- ✅ "My Payroll Documents" accessible
- ✅ No errors in browser console

### Vendor Onboarding Success:
- ✅ Invitation code works
- ✅ Can complete all 7 steps
- ✅ Documents upload successfully
- ✅ Vendor account created
- ✅ Can login with new credentials
- ✅ Proper role-based access
- ✅ Documents pending approval
- ✅ No errors in browser console

---

## 🐛 Troubleshooting

**If employee not redirected to onboarding:**
- Check `onboarding_completed` field in users collection
- Should be `false` or not exist

**If vendor invitation invalid:**
- Verify invitation code in `vendor_invitations` collection
- Check status is "pending" not "completed"

**If documents not uploading:**
- Check `/app/backend/vendor_documents/` directory exists
- Check file permissions

**If emails not sending:**
- Configure SMTP settings in Admin Panel first
- For testing, view email templates at `/email_samples/`

---

## 📝 Notes

- Test data is safe to use - no real SSN/EIN
- You can repeat tests by deleting user records
- Invitation codes can be reused if deleted from DB
- All onboarding is AI-ready but needs SMTP config for emails
