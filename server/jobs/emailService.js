import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email templates
const emailTemplates = {
  dailyReminder: (data) => ({
    subject: "🎯 Daily Quiz Reminder - Keep Learning with QuizMaster!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0; font-size: 28px;">📚 QuizMaster</h1>
            <p style="color: #6B7280; margin: 10px 0 0 0; font-size: 16px;">Your Daily Learning Reminder</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #1F2937; margin: 0 0 15px 0;">Hi ${
              data.username || "there"
            }! 👋</h2>
            <p style="color: #4B5563; line-height: 1.6; margin: 0;">
              Don't let your learning streak break! We have <strong>${
                data.availableQuizzes || 0
              }</strong> exciting quizzes waiting for you.
              Take a few minutes today to challenge yourself and expand your knowledge.
            </p>
          </div>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1F2937; margin: 0 0 10px 0; font-size: 18px;">🎯 Why take a quiz today?</h3>
            <ul style="color: #4B5563; margin: 0; padding-left: 20px;">
              <li>Reinforce your learning</li>
              <li>Track your progress</li>
              <li>Discover new topics</li>
              <li>Challenge yourself</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:5173"
            }/dashboard" 
               style="background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🚀 Start Learning Now
            </a>
          </div>
          
          <div style="text-align: center; color: #9CA3AF; font-size: 14px;">
            <p style="margin: 0;">Keep learning, keep growing! 🌱</p>
            <p style="margin: 5px 0 0 0;">
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:5173"
              }/settings" style="color: #6B7280;">Unsubscribe</a>
            </p>
          </div>
        </div>
      </div>
    `,
  }),

  weeklyReport: (data) => ({
    subject: "📊 Your Weekly Quiz Performance Report",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0; font-size: 28px;">📊 Weekly Report</h1>
            <p style="color: #6B7280; margin: 10px 0 0 0; font-size: 16px;">Your Learning Progress</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #1F2937; margin: 0 0 15px 0;">Great work this week, ${
              data.username || "there"
            }! 🎉</h2>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
            <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="color: #1E40AF; margin: 0 0 5px 0; font-size: 24px;">${
                data.stats?.quizzesCompleted || 0
              }</h3>
              <p style="color: #3B82F6; margin: 0; font-weight: bold;">Quizzes Completed</p>
            </div>
            <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="color: #166534; margin: 0 0 5px 0; font-size: 24px;">${
                data.stats?.averageScore || 0
              }%</h3>
              <p style="color: #16A34A; margin: 0; font-weight: bold;">Average Score</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:5173"
            }/history" 
               style="background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              📈 View Full Report
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  adminDailyReport: (data) => ({
    subject: "📊 QuizMaster Daily Admin Report",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0; font-size: 28px;">🔧 Admin Report</h1>
            <p style="color: #6B7280; margin: 10px 0 0 0; font-size: 16px;">Daily System Overview</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #1F2937; margin: 0 0 15px 0;">System Status - ${new Date().toLocaleDateString()}</h2>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
            <div style="background: #EFF6FF; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="color: #1E40AF; margin: 0 0 5px 0; font-size: 20px;">${
                data.totalUsers || 0
              }</h3>
              <p style="color: #3B82F6; margin: 0; font-size: 14px;">Total Users</p>
            </div>
            <div style="background: #F0FDF4; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="color: #166534; margin: 0 0 5px 0; font-size: 20px;">${
                data.totalAttempts || 0
              }</h3>
              <p style="color: #16A34A; margin: 0; font-size: 14px;">Total Attempts</p>
            </div>
            <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="color: #92400E; margin: 0 0 5px 0; font-size: 20px;">${
                data.todayAttempts || 0
              }</h3>
              <p style="color: #D97706; margin: 0; font-size: 14px;">Today's Attempts</p>
            </div>
            <div style="background: #FDF2F8; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="color: #BE185D; margin: 0 0 5px 0; font-size: 20px;">${
                data.averageScore || 0
              }%</h3>
              <p style="color: #EC4899; margin: 0; font-size: 14px;">Avg Score</p>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:5173"
            }/admin" 
               style="background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🎛️ View Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    `,
  }),
};

// Send email function
export const sendEmail = async (to, template, data) => {
  try {
    // Check if email configuration is available
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(
        `⚠️ Email configuration missing - would send ${template} to ${to}`
      );
      console.log(`📧 Email data:`, JSON.stringify(data, null, 2));
      return { success: true, messageId: "test-mode", testMode: true };
    }

    const transporter = createTransporter();
    const emailContent = emailTemplates[template](data);

    const mailOptions = {
      from: `"QuizMaster" <${process.env.SMTP_USER}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

// Send bulk emails
export const sendBulkEmails = async (recipients, template, getData) => {
  const results = [];

  for (const recipient of recipients) {
    const data = await getData(recipient);
    const result = await sendEmail(recipient.email, template, data);
    results.push({
      email: recipient.email,
      username: recipient.username,
      ...result,
    });

    // Add delay to avoid rate limiting (only if actually sending emails)
    if (!result.testMode) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
};
