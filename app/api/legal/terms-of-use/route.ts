import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), 'legal', 'terms-of-use.md');
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return NextResponse.json({
        content,
        lastModified: fs.statSync(filePath).mtime
      });
    } else {
      return NextResponse.json({
        content: `# Terms of Use

**Effective Date: ${new Date().toLocaleDateString()}**
**Last Updated: ${new Date().toLocaleDateString()}**

## 1. Introduction

Welcome to **Ludo Battle** ("Platform", "we", "us", or "our"), a skill-based online gaming platform that allows users to participate in Ludo matches for real money. These Terms of Use ("Terms") govern your access to and use of our platform.

By accessing or using our platform, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our platform.

## 2. Eligibility and User Requirements

### 2.1 Age Requirement
- You must be at least 18 years old to use this platform
- Users must provide valid government-issued identification for verification
- Minors are strictly prohibited from accessing or using our services

### 2.2 Geographic Restrictions
- Our services are available only in jurisdictions where skill-based gaming is legal
- Users are responsible for ensuring compliance with local laws
- We reserve the right to restrict access based on geographic location

### 2.3 Account Requirements
- One account per person/household
- Valid phone number and email address required
- Accurate personal information must be provided
- Account sharing or transfer is prohibited

## 3. Platform Rules and Fair Play

### 3.1 Skill-Based Gaming
- All games on our platform are skill-based competitions
- Outcomes depend on player strategy, decision-making, and game knowledge
- No element of chance determines game results

### 3.2 Prohibited Activities
- Use of bots, automation tools, or cheating software
- Collusion with other players
- Account sharing or selling
- Fraudulent payment methods
- Multiple accounts by same user

### 3.3 Fair Play Enforcement
- We monitor all gameplay for suspicious activity
- Violations result in account suspension or termination
- Winnings from fraudulent activity will be forfeited

## 4. Financial Terms

### 4.1 Entry Fees and Winnings
- Entry fees are charged when joining matches
- Winners receive the prize pool minus platform commission
- All transactions are processed securely

### 4.2 Deposits and Withdrawals
- Minimum deposit and withdrawal limits apply
- Withdrawal processing time: 1-7 business days
- Valid payment proof required for deposits
- UPI details required for withdrawals

### 4.3 Platform Commission
- We charge a service fee on completed matches
- Commission rates are clearly displayed before match entry
- Fees help maintain platform operations and security

## 5. User Responsibilities

### 5.1 Account Security
- Maintain confidentiality of login credentials
- Report suspicious activity immediately
- Use strong, unique passwords
- Enable two-factor authentication when available

### 5.2 Responsible Gaming
- Set personal limits on time and money spent
- Play only with money you can afford to lose
- Seek help if gaming becomes problematic
- Report concerns about other players' behavior

### 5.3 Technical Requirements
- Stable internet connection required
- Compatible device and updated browser
- Responsibility for technical issues on user's end

## 6. Platform Policies

### 6.1 Privacy and Data Protection
- We collect and process data as outlined in our Privacy Policy
- Personal information is protected and not shared with third parties
- Users can request data deletion subject to legal requirements

### 6.2 Communication
- Platform notifications sent via email/SMS
- Marketing communications require opt-in consent
- Users can unsubscribe from promotional messages

### 6.3 Dispute Resolution
- Disputes handled through our internal resolution process
- Evidence review by qualified staff
- Final decisions are binding and non-appealable

## 7. Prohibited Content and Conduct

### 7.1 Content Restrictions
- No offensive, hateful, or discriminatory content
- No spam, advertising, or promotional material
- No sharing of personal information of other users

### 7.2 Behavioral Standards
- Respectful communication with other users
- No harassment, bullying, or threatening behavior
- No attempts to manipulate or exploit other users

## 8. Platform Modifications

### 8.1 Service Changes
- We reserve the right to modify platform features
- Users will be notified of significant changes
- Continued use constitutes acceptance of modifications

### 8.2 Maintenance and Downtime
- Regular maintenance may cause temporary service interruption
- Advance notice provided when possible
- No compensation for planned maintenance downtime

## 9. Account Termination

### 9.1 User-Initiated Termination
- Users can close accounts at any time
- Remaining balance will be processed for withdrawal
- Account data may be retained for legal compliance

### 9.2 Platform-Initiated Termination
- We may suspend or terminate accounts for policy violations
- Serious violations may result in immediate termination
- Appeal process available for disputed decisions

## 10. Legal Compliance

### 10.1 Applicable Law
- These Terms are governed by Indian law
- Disputes subject to jurisdiction of Indian courts
- Users must comply with all applicable local laws

### 10.2 Tax Responsibilities
- Users responsible for reporting winnings to tax authorities
- Platform may provide transaction records for tax purposes
- Professional tax advice recommended for significant winnings

## 11. Limitation of Liability

### 11.1 Service Availability
- Platform provided "as is" without warranties
- No guarantee of uninterrupted service
- Users assume risk of technical issues

### 11.2 Financial Liability
- Our liability limited to amount of user's account balance
- No liability for consequential or indirect damages
- Force majeure events exempt from liability

## 12. Contact Information

For questions about these Terms of Use, please contact us:

- Email: legal@ludobattle.com
- Phone: [Support Phone Number]
- Address: [Company Address]

## 13. Updates to Terms

These Terms may be updated periodically. Users will be notified of material changes via email or platform notification. Continued use of the platform after changes constitutes acceptance of the updated Terms.

---

**By using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use.**`,
        lastModified: new Date()
      });
    }

  } catch (error) {
    console.error('Error reading terms file:', error);
    return NextResponse.json(
      { error: 'Failed to load terms of use' },
      { status: 500 }
    );
  }
}
