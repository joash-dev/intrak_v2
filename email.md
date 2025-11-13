# Email Service Logic - Complete Documentation

This document contains all the email service logic from the PDS project that can be applied to another Laravel project.

## Table of Contents
1. [Configuration Setup](#configuration-setup)
2. [Mail Classes](#mail-classes)
3. [Email Templates](#email-templates)
4. [Usage Examples](#usage-examples)
5. [Environment Variables](#environment-variables)

---

## Configuration Setup

### 1. Mail Configuration File (`config/mail.php`)

The mail configuration is already set up in Laravel. Ensure your `config/mail.php` file includes:

```php
<?php

return [
    'default' => env('MAIL_MAILER', 'smtp'),

    'mailers' => [
        'smtp' => [
            'transport' => 'smtp',
            'host' => env('MAIL_HOST', 'smtp.mailtrap.io'),
            'port' => env('MAIL_PORT', 2525),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN'),
        ],
        // ... other mailers
    ],

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
        'name' => env('MAIL_FROM_NAME', 'Example'),
    ],
];
```

---

## Mail Classes

### 1. OTP Mail (`app/Mail/OTPmail.php`)

Used for sending OTP during user registration.

```php
<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OTPmail extends Mailable
{
    use Queueable, SerializesModels;

    public $otp;

    /**
     * Create a new message instance.
     */
    public function __construct($otp)
    {
        $this->otp = $otp;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'OTP Verification',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.otp',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
```

### 2. Reset Password OTP Mail (`app/Mail/ResetOTPmail.php`)

Used for sending OTP during password reset.

```php
<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetOTPmail extends Mailable
{
    use Queueable, SerializesModels;

    public $otp;

    /**
     * Create a new message instance.
     */
    public function __construct($otp)
    {
        $this->otp = $otp;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Password OTP Verification',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.resetpassword_otp',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
```

### 3. Notify Applicant Mail (`app/Mail/NotifyApplicantMail.php`)

Used for notifying applicants about examination schedules. **Note:** This uses `ShouldQueue` for queued emails.

```php
<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\JobVacancy;
use App\Models\User;
use App\Models\ExamDetail;

class NotifyApplicantMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $vacancy_id;
    public $user_id;
    public $exam_id;

    public $vacancy;
    public $user;
    public $exam;

    /**
     * Create a new message instance.
     */
    public function __construct($vacancy_id, $user_id, $exam_id)
    {
        $this->vacancy_id = $vacancy_id;
        $this->user_id = $user_id;
        $this->exam_id = $exam_id;

        $this->vacancy = JobVacancy::where('vacancy_id', $this->vacancy_id)->firstOrFail();
        $this->user = User::findOrFail($this->user_id);
        $this->exam = ExamDetail::findOrFail($this->exam_id);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'DILG-CAR Examination',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.exam_sched_link',
            with: [
                'vacancy' => $this->vacancy,
                'user' => $this->user,
                'exam' => $this->exam,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
```

### 4. Notify Application Status Mail (`app/Mail/NotifyApplicationStatus.php`)

Used for notifying applicants about application status changes.

```php
<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

use App\Models\JobVacancy;
use App\Models\User;

class NotifyApplicationStatus extends Mailable
{
    use Queueable, SerializesModels;

    public $user_id;
    public $vacancy_id;
    public $admin_name;
    public $changes;
    public $status;
    public $date;
    public $applicant_name;
    public $position_title;

    /**
     * Create a new message instance.
     */
    public function __construct($admin_name, $changes, $status, $user_id, $vacancy_id)
    {
        $this->user_id = $user_id;
        $this->vacancy_id = $vacancy_id;
        $this->admin_name = $admin_name;
        $this->changes = $changes;
        $this->status = $status;
        $this->date = now();
        $this->applicant_name = User::where('id', $user_id)->value('name');
        $this->position_title = JobVacancy::where('vacancy_id', $vacancy_id)->value('position_title');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'DILG-CAR Application Status',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.notifyApplicationStatus',
            with: [
                'user_id' => $this->user_id,
                'vacancy_id' => $this->vacancy_id,
                'admin_name' => $this->admin_name,
                'changes' => $this->changes,
                'status' => $this->status,
                'date' => $this->date,
                'applicant_name' => $this->applicant_name,
                'position_title' => $this->position_title,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
```

---

## Email Templates

### 1. OTP Email Template (`resources/views/emails/otp.blade.php`)

```blade
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OTP Verification</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Montserrat', sans-serif;
      background-color: #F3F8FF;
    }

    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #FFFFFF;
      border: 1px solid #cfd9e0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }

    .header {
      padding: 20px 30px 10px;
      display: flex;
      align-items: center;
    }

    .logo {
      width: 60px;
      height: 60px;
      margin-right: 15px;
    }

    .title-text {
      color: #002c63;
    }

    .title-text h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      line-height: 1.3;
    }

    .banner {
      background-color: #002C76;
      color: white;
      padding: 15px 30px;
      margin: 15px 15px 0px 15px;
      font-size: 18px;
      font-weight: 700;
      border-radius: 16px 16px 16px 16px;
      display: flex;
      align-items: center;
    }

    .banner img {
      width: 20px;
      margin-right: 10px;
    }

    .content {
      padding: 0px 30px 15px 30px;
      color: #1a202c;
      font-size: 15px;
      line-height: 1.6;
    }

    .otp-box {
      margin: 20px 0;
      background-color: #f2f2f2;
      border: 2px dashed #002c63;
      text-align: center;
      font-size: 28px;
      font-weight: 700;
      padding: 20px;
      color: #002c63;
      letter-spacing: 4px;
      border-radius: 8px;
    }

    .footer {
      padding: 0 30px 30px;
      font-size: 14px;
      color: #2d3748;
    }

    .footer strong {
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="YOUR_LOGO_URL_HERE" alt="Logo" class="logo">
      <div class="title-text">
        <h2>Your Application Name</h2>
      </div>
    </div>

    <!-- Banner -->
    <div class="banner">
      <img src="https://img.icons8.com/ios-filled/50/ffffff/key-security.png" alt="Key Icon" />
      One-Time Password (OTP)
    </div>

    <!-- Content -->
    <div class="content">
      <p>Hello!</p>
      <p>
        You are registering a new account. To verify your account, here is your OTP to be entered on the verification page:
      </p>

      <div class="otp-box">
        {{ $otp }}
      </div>

      <p>This code will expire in <strong>5 minutes</strong>.</p>
      <p>Do not share this code with anyone.</p>
      <p>If you didn't request this code, just ignore this email. Thank you!</p>
      <p><br><strong>– Your Company Name</strong></p>
    </div>
  </div>
</body>
</html>
```

### 2. Reset Password OTP Email Template (`resources/views/emails/resetpassword_otp.blade.php`)

```blade
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset Password OTP</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Montserrat', sans-serif;
      background-color: #F3F8FF;
    }

    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #FFFFFF;
      border: 1px solid #cfd9e0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }

    .header {
      padding: 20px 30px 10px;
      display: flex;
      align-items: center;
    }

    .logo {
      width: 60px;
      height: 60px;
      margin-right: 15px;
    }

    .title-text {
      color: #002c63;
    }

    .title-text h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      line-height: 1.3;
    }

    .banner {
      background-color: #002C76;
      color: white;
      padding: 15px 30px;
      margin: 15px 15px 0px 15px;
      font-size: 18px;
      font-weight: 700;
      border-radius: 16px 16px 16px 16px;
      display: flex;
      align-items: center;
    }

    .banner img {
      width: 20px;
      margin-right: 10px;
    }

    .content {
      padding: 0px 30px 15px 30px;
      color: #1a202c;
      font-size: 15px;
      line-height: 1.6;
    }

    .otp-box {
      margin: 20px 0;
      background-color: #f2f2f2;
      border: 2px dashed #002c63;
      text-align: center;
      font-size: 28px;
      font-weight: 700;
      padding: 20px;
      color: #002c63;
      letter-spacing: 4px;
      border-radius: 8px;
    }

    .footer {
      padding: 0 30px 30px;
      font-size: 14px;
      color: #2d3748;
    }

    .footer strong {
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="YOUR_LOGO_URL_HERE" alt="Logo" class="logo">
      <div class="title-text">
        <h2>Your Application Name</h2>
      </div>
    </div>

    <!-- Banner -->
    <div class="banner">
      <img src="https://img.icons8.com/ios-filled/50/ffffff/key-security.png" alt="Key Icon" />
      Reset Password One-Time Password (OTP)
    </div>

    <!-- Content -->
    <div class="content">
      <p>Hello!</p>
      <p>
        You are <strong>resetting</strong> your password. To verify your account, here is your OTP to be entered on the verification page:
      </p>

      <div class="otp-box">
        {{ $otp }}
      </div>

      <p>This code will expire in <strong>5 minutes</strong>.</p>
      <p>Do not share this code with anyone.</p>
      <p>If you didn't request this code, just ignore this email. Thank you!</p>
      <p><br><strong>– Your Company Name</strong></p>
    </div>
  </div>
</body>
</html>
```

### 3. Exam Schedule Email Template (`resources/views/emails/exam_sched_link.blade.php`)

```blade
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Examination Schedule</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Montserrat', sans-serif;
      background-color: #F3F8FF;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #FFFFFF;
      border: 1px solid #cfd9e0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    .header {
      padding: 20px 30px 10px;
      display: flex;
      align-items: center;
    }
    .logo {
      width: 60px;
      height: 60px;
      margin-right: 15px;
    }
    .title-text h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #002C63;
      line-height: 1.3;
    }
    .banner {
      background-color: #002C76;
      color: white;
      padding: 15px 30px;
      margin: 15px 15px 0px 15px;
      font-size: 18px;
      font-weight: 700;
      border-radius: 16px;
      display: flex;
      align-items: center;
    }
    .banner img {
      width: 20px;
      margin-right: 10px;
      filter: brightness(0) invert(1);
    }
    .content {
      padding: 0px 30px 15px 30px;
      color: #1a202c;
      font-size: 15px;
      text-align: justify;
      line-height: 1.6;
    }
    .exam-details {
      margin: 20px 0;
      background-color: #f2f2f2;
      border: 2px dashed #cfd9e0;
      border-radius: 8px;
      padding: 15px;
    }
    .exam-details h3 {
      margin-top: 0;
      color: #002C63;
      font-weight: 700;
      font-size: 16px;
    }
    .exam-details p {
      margin: 4px 0;
      line-height: 1.4;
    }

    .join-button {
      display: block;
      margin: 10px;
      text-align: center;
      text-decoration: none;
      padding: 12px;
      background-color: #002C76;
      color: white !important;
      font-weight: 600;
      border-radius: 8px;
      font-size: 15px;
    }

    .note {
      font-size: 13px;
      color: #718096;
      margin-top: 10px;
    }
    .footer {
      padding: 0 30px 30px;
      font-size: 13px;
      color: #2d3748;
    }
    .footer strong {
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="YOUR_LOGO_URL_HERE" alt="Logo" class="logo" />
      <div class="title-text">
        <h2>Your Application Name</h2>
      </div>
    </div>

    <!-- Banner -->
    <div class="banner">
      <img src="https://cdn-icons-png.flaticon.com/512/1827/1827392.png" alt="Schedule Icon" />
      Examination Schedule
    </div>
    <!-- Content -->
    <div class="content">
      <p>Hello {{ $user->name ?? 'Applicant' }}!</p>
      <p>
        Thank you for your interest. We are pleased to inform you that you are scheduled to take an examination. Please find the details below:
      </p>

    <div class="exam-details">
      <h3>{{ $vacancy->position_title ?? '[Position Title]' }}</h3>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 15px;">
        <tr>
          <td style="font-weight:700; color:#002C63; padding: 4px 0;">Date:</td>
          <td>{{ $exam->date ?? '[Month Day, Year]' }}</td>
        </tr>
        <tr>
          <td style="font-weight:700; color:#002C63; padding: 4px 0;">Time:</td>
          <td>{{ $exam->time ?? '[00:00 AM/PM]' }}</td>
        </tr>
        <tr>
          <td style="font-weight:700; color:#002C63; padding: 4px 0;">Venue:</td>
          <td>
            {{ $exam->place ?? '[Office Name]' }}
          </td>
        </tr>
      </table>
    </div>
      <p>
        Please ensure that you arrive at the venue at least 30 minutes before the scheduled time.
      </p>

      <p>
        The examination will be conducted in person, but you will also need to access it through the link below:
      </p>

      <a href="{{ $join_link ?? '#' }}" class="join-button">Access Exam Link</a>

      <p class="note">
         If the button above does not work, please copy and paste this link into your browser:<br>
        <p class="note" style="word-break: break-all; margin-top: -10px;">{{ $join_link ?? '[exam_link_here]' }} </p>
      </p>

      <p>
        If you have any questions or concerns, please feel free to reply to this email.
      </p>
      <p>
        We look forward to seeing you. Thank you.<br>
        <strong>– Your Company Name</strong>
      </p>
    </div>
  </div>
</body>
</html>
```

### 4. Application Status Email Template (`resources/views/emails/notifyApplicationStatus.blade.php`)

```blade
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Application Status Update</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Montserrat', sans-serif;
      background-color: #F3F8FF;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #FFFFFF;
      border: 1px solid #cfd9e0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    .header {
      padding: 20px 30px 10px;
      display: flex;
      align-items: center;
    }
    .logo {
      width: 60px;
      height: 60px;
      margin-right: 15px;
    }
    .title-text h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #002C63;
      line-height: 1.3;
    }
    .banner {
      background-color: #002C76;
      color: white;
      padding: 15px 30px;
      margin: 15px 15px 0px 15px;
      font-size: 18px;
      font-weight: 700;
      border-radius: 16px;
      display: flex;
      align-items: center;
    }
    .banner img {
      width: 20px;
      margin-right: 10px;
      filter: brightness(0) invert(1);
    }
    .content {
      padding: 0px 30px 15px 30px;
      color: #1a202c;
      font-size: 15px;
      text-align: justify;
      line-height: 1.6;
    }
    .status-box {
      margin: 20px 0;
      background-color: #f2f2f2;
      border: 2px dashed #cfd9e0;
      border-radius: 8px;
      padding: 15px;
    }
    .status-box h3 {
      margin-top: 0;
      color: #002C63;
      font-weight: 700;
      font-size: 16px;
    }
    .status-box p {
      margin: 4px 0;
      line-height: 1.4;
    }
    .status-link {
      display: block;
      margin: 10px;
      text-align: center;
      text-decoration: none;
      padding: 12px;
      background-color: #002C76;
      color: white !important;
      font-weight: 600;
      border-radius: 8px;
      font-size: 15px;
    }
    .note {
      font-size: 13px;
      color: #718096;
      margin-top: 10px;
    }
    .footer {
      padding: 0 30px 30px;
      font-size: 13px;
      color: #2d3748;
    }
    .footer strong {
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="YOUR_LOGO_URL_HERE" alt="Logo" class="logo" />
      <div class="title-text">
        <h2>Your Application Name</h2>
      </div>
    </div>

    <!-- Banner -->
    <div class="banner">
      <img src="https://cdn-icons-png.flaticon.com/512/1827/1827392.png" alt="Notification Icon" />
      Application Status Update
    </div>

    <!-- Content -->
    <div class="content">
      <p>Hello {{ $applicant_name ?? 'Applicant' }},</p>

      <p>
        This is to notify you that changes have been made to your application for the position of 
        <strong>{{ $position_title ?? '[Position Title]' }}</strong>.
      </p>

      <div class="status-box">
        <h3>Summary of Changes</h3>
        <ul style="padding-left: 20px; margin: 0;">
          <li><strong>Date of Change:</strong> {{ $date ?? '[Date not provided]' }}</li>
          <li><strong>Status:</strong> {{ $status ?? '—' }}</li>
          <li><strong>Changes:</strong>
              <ul>
                  @foreach ($changes as $field => $change)
                      <li>
                          <strong>{{ ucfirst(str_replace('_', ' ', $field)) }}</strong>:
                          {{ $change['old'] ?? 'N/A' }} → {{ $change['new'] ?? 'N/A' }}
                      </li>
                  @endforeach
              </ul>
          </li>
          <li><strong>Admin:</strong> {{ $admin_name ?? 'Admin' }}</li>
        </ul>
      </div>

      <p>
        To view the full details of your application, please click the button below:
      </p>

      <a href="{{ route('application_status', ['user' => $user_id, 'vacancy' => $vacancy_id]) }}" class="status-link">View My Application</a>

      <p class="note">
        If the button above does not work, copy and paste this link into your browser:<br>
        <span style="word-break: break-all;">{{ route('application_status', ['user' => $user_id, 'vacancy' => $vacancy_id]) }}</span>
      </p>

      <p>
        If you have any questions or concerns, feel free to reach out via email.
      </p>

      <p>
        Thank you for your continued interest in joining our team.<br>
        <strong>– Your Company Name</strong>
      </p>
    </div>
  </div>
</body>
</html>
```

---

## Usage Examples

### 1. Sending OTP Email (Registration)

```php
use Illuminate\Support\Facades\Mail;
use App\Mail\OTPmail;

// Generate OTP
$otp = rand(100000, 999999);

// Store OTP in database (example)
$user = User::create([
    'email' => $request->email,
    'otp' => $otp,
    'otp_expires_at' => now()->addMinutes(5),
]);

// Send email
Mail::to($request->email)->send(new OTPmail($otp));
```

### 2. Sending Reset Password OTP Email

```php
use Illuminate\Support\Facades\Mail;
use App\Mail\ResetOTPmail;

// Generate OTP
$otp = rand(100000, 999999);

// Update user record
$user = User::where('email', $request->email)->first();
$user->otp = $otp;
$user->otp_expires_at = now()->addMinutes(5);
$user->save();

// Send email
Mail::to($request->email)->send(new ResetOTPmail($otp));
```

### 3. Sending Exam Schedule Notification (Queued)

```php
use Illuminate\Support\Facades\Mail;
use App\Mail\NotifyApplicantMail;

// Send to multiple users (queued)
$participants = Applications::where('vacancy_id', $vacancy_id)->get();

foreach ($participants as $participant) {
    $user_id = $participant->user_id;
    $user_email = User::select('email')->where('id', $user_id)->firstOrFail();
    
    if ($user_id) {
        // Using queue() instead of send() for better performance
        Mail::to($user_email)->queue(new NotifyApplicantMail($vacancy_id, $user_id, $exam_id));
    }
}
```

### 4. Sending Application Status Update

```php
use Illuminate\Support\Facades\Mail;
use App\Mail\NotifyApplicationStatus;

// Prepare data
$userEmail = User::where('id', $user_id)->value('email');
$admin_name = auth('admin')->user()->username;
$changes = [
    'status' => [
        'old' => $old_status,
        'new' => $new_status
    ],
    // ... other changes
];

// Send email
Mail::to($userEmail)->send(new NotifyApplicationStatus(
    $admin_name,
    $changes,
    $application->status,
    $user_id,
    $vacancy_id
));
```

---

## Environment Variables

Add these to your `.env` file:

```env
# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourapp.com
MAIL_FROM_NAME="${APP_NAME}"

# For production, you might use:
# MAIL_MAILER=smtp
# MAIL_HOST=smtp.gmail.com
# MAIL_PORT=587
# MAIL_USERNAME=your_email@gmail.com
# MAIL_PASSWORD=your_app_password
# MAIL_ENCRYPTION=tls
```

---

## Queue Configuration (For Queued Emails)

If you're using queued emails (like `NotifyApplicantMail`), make sure to:

1. **Set up queue driver** in `.env`:
```env
QUEUE_CONNECTION=database
```

2. **Create queue table**:
```bash
php artisan queue:table
php artisan migrate
```

3. **Run queue worker**:
```bash
php artisan queue:work
```

Or use Laravel Horizon/Supervisor for production.

---

## Notes for Implementation

1. **Customize Templates**: Update logo URLs, company names, and styling in the email templates to match your brand.

2. **Model Dependencies**: The `NotifyApplicantMail` and `NotifyApplicationStatus` classes reference specific models (`JobVacancy`, `User`, `ExamDetail`). Adjust these to match your project's models.

3. **Routes**: The `notifyApplicationStatus.blade.php` template uses a route helper. Make sure the route exists in your project or update the URL.

4. **Queue vs Send**: 
   - Use `send()` for immediate email delivery
   - Use `queue()` for better performance when sending multiple emails

5. **Testing**: Use Mailtrap or similar service for testing emails in development.

---

## Quick Setup Checklist

- [ ] Copy Mail classes to `app/Mail/` directory
- [ ] Copy email templates to `resources/views/emails/` directory
- [ ] Configure `.env` with mail settings
- [ ] Update email templates with your branding
- [ ] Adjust model references in Mail classes if needed
- [ ] Set up queue system if using queued emails
- [ ] Test each email type

---

**End of Documentation**

