package com.x.pelegant.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.annotation.PreDestroy;
import javax.mail.internet.MimeMessage;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Slf4j
public class EmailServices {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@pelegant.com}")
    private String fromEmail;

    private final ExecutorService executorService;

public EmailServices() {
    // 使用自定义线程池配置
    this.executorService = new ThreadPoolExecutor(
        10, // 核心线程数
        50, // 最大线程数
        60L, TimeUnit.SECONDS, // 空闲线程存活时间
        new LinkedBlockingQueue<>(1000), // 有界队列
        new ThreadFactory() {
            private final AtomicInteger threadNumber = new AtomicInteger(1);
            @Override
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r, "email-sender-" + threadNumber.getAndIncrement());
                t.setDaemon(false);
                return t;
            }
        },
        new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略：由调用线程执行
    );
}


    public enum EmailType {
        STUDENT_INITIAL_PASSWORD,
        ADMIN_INITIAL_PASSWORD,
        COMPANY_ADMIN_INITIAL_PASSWORD,
        PROJECT_ADMIN_INITIAL_PASSWORD,
        TEACHER_INITIAL_PASSWORD,
        PASSWORD_RESET,
        PASSWORD_RESET_LINK,
        STUDENT_PASSWORD_RESET_LINK
    }

    /**
     * 多线程异步发送邮件
     */
    public Future<Boolean> sendEmailAsync(String toEmail, String recipientName, String schoolOrCompany,
                                          String password, EmailType type, String userType, String resetLink) {
        return executorService.submit(() -> sendEmail(toEmail, recipientName, schoolOrCompany, password, type, userType, resetLink));
    }

    /**
     * 统一发送邮件方法（原方法）
     */
    public boolean sendEmail(String toEmail, String recipientName, String schoolOrCompany,
                             String password, EmailType type, String userType, String resetLink) {
        int maxRetries = 3;
        for (int i = 0; i < maxRetries; i++){
        try {
            log.info("发送邮件: {} - {}", toEmail, type);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            String subject = "";
            String htmlContent = "";

            // 根据 EmailType 构建邮件内容
            switch (type) {
                case STUDENT_INITIAL_PASSWORD:
                    subject = "Your Exclusive Access to Pelegant — " + schoolOrCompany + " Career Center’s New AI Career Platform";
                    htmlContent = buildEmailHtmlContent(recipientName, toEmail, password, schoolOrCompany, "Student", "http://pelegant.info:8081", "", type);
                    break;
                case ADMIN_INITIAL_PASSWORD:
                    subject = "Welcome to Pelegant! Your Administrator Account for " + schoolOrCompany + " is Ready";
                    htmlContent = buildEmailHtmlContent(recipientName, toEmail, password, schoolOrCompany, "Administrator", "http://pelegant.info:8083", "", type);
                    break;
                case COMPANY_ADMIN_INITIAL_PASSWORD:
                    subject = "Welcome to Pelegant! Company Administrator Account Creation Notification";
                    htmlContent = buildEmailHtmlContent(recipientName, toEmail, password, schoolOrCompany, "Company Administrator", "http://pelegant.info:8083/", "", type);
                    break;
                case PROJECT_ADMIN_INITIAL_PASSWORD:
                    subject = "Welcome to Pelegant! Your Administrator Account for " + schoolOrCompany + " is Ready";
                    htmlContent = buildEmailHtmlContent(recipientName, toEmail, password, schoolOrCompany, "Project Administrator", "http://pelegant.info:8083", "", type);
                    break;
                case TEACHER_INITIAL_PASSWORD:
                    subject = "Welcome to Pelegant! Your " + userType + " Account for " + schoolOrCompany + " is Ready";
                    htmlContent = buildEmailHtmlContent(recipientName, toEmail, password, schoolOrCompany, userType, "http://pelegant.info:8082", "", type);
                    break;
                case PASSWORD_RESET:
                    subject = "Password Reset ";
                    htmlContent = buildEmailHtmlContent(recipientName, toEmail, password, schoolOrCompany, "", "http://pelegant.info:8082", "", type);
                    break;
                case PASSWORD_RESET_LINK:
                    subject = "Password Reset Link";
                    htmlContent = passwordresetlink(recipientName, toEmail, schoolOrCompany, resetLink);
                    break;
                case STUDENT_PASSWORD_RESET_LINK:
                    subject = "Password Reset Link";
                    htmlContent = studentpasswordresetlink(recipientName, toEmail, schoolOrCompany, resetLink);
                    break;
                default:
                    throw new IllegalArgumentException("Unknown EmailType: " + type);
            }

            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
            log.info("邮件发送成功: {}", toEmail);
            return true;
        } catch (Exception e) {
            log.warn("邮件发送失败，第{}次重试: {} - {}", i+1, toEmail, e.getMessage());
            if (i == maxRetries - 1) {
                log.error("邮件发送最终失败: {} - {}", toEmail, e.getMessage(), e);
                return false;
            }
            // 等待后重试
            try {
                Thread.sleep(1000 * (i + 1)); // 递增等待时间
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
    }
    return false;
}
    /**
     * HTML 邮件模板构建,常规邮件
     */
    private String buildEmailHtmlContent(String recipientName, String loginEmail, String password,
                                         String schoolOrCompany, String userType, String loginUrl, String extraNote, EmailType emailType) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>")
                .append("<html lang='en'>")
                .append("<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>")
                .append("<style>") // 样式部分保持不变
                .append("body {font-family: Arial, sans-serif; background-color:#e6f0fa; margin:0; padding:0;}")
                .append(".container {max-width:600px; width:90%; margin:30px auto; background:#fff; padding:25px; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.1);}")
                .append(".header {text-align:center; font-size:22px; color:#0a3d91; margin-bottom:20px;}")
                .append(".content {font-size:16px; color:#333; line-height:1.6;}")
                .append(".button {display:inline-block; padding:12px 24px; background:#0a3d91; color:#fff; text-decoration:none; border-radius:6px; margin:15px 0; text-align:center;}")
                .append(".footer {text-align:center; font-size:12px; color:#777; margin-top:25px;}")
                .append("@media only screen and (max-width:480px){.container{padding:15px}.header{font-size:20px}.content{font-size:15px}.button{width:100%;padding:12px 0}}")
                .append("</style></head><body>");


        // 针对STUDENT_INITIAL_PASSWORD的邮件内容
        if (emailType == EmailType.STUDENT_INITIAL_PASSWORD) {
            sb.append("<div class='container'>")
                    .append("<div class='header'>Welcome to the Pelegant System</div>")
                    .append("<div class='content'>")
                    .append("<p> </p>")
                    .append("<p>Dear ").append(recipientName).append(",</p>")
                    .append("<p> </p>")
                    .append("<p>The ").append(schoolOrCompany).append(" Career Center is excited to provide you with exclusive access to Pelegant, ")
                    .append("our new AI-powered career platform designed to give you a competitive edge.</p>")
                    .append("<p> </p>")
                    .append("<p>Pelegant act as your personal career strategist. Use it to:</p>")
                    .append("<ul>")
                    .append("<li>Get AI-Powered Recommendations: Discover job and internship opportunities perfectly matched to your skills and aspirations.</li>")
                    .append("<li>Strengthen Your Application: Receive instant AI feedback to optimize your resume and cover letters.</li>")
                    .append("<li>Ace Your Interviews: Use the AI simulator to practice your interview skills and build confidence.</li>")
                    .append("<li>Connect with Employers: Build your professional profile and get noticed by top companies actively recruiting from ").append(schoolOrCompany).append(".</li>")
                    .append("</ul>")
                    .append("<p> </p>")
                    .append("<p><strong>Activate Your Account in 2 Minutes:</strong></p>")
                    .append("<p>1. Go to the Pelegant Platform: <a href='http://pelegant.info:8081/login'>http://pelegant.info:8081/login</a><br>")
                    .append("(If the link doesn’t open, please copy and paste the URL into your browser.)</p>")
                    .append("<p>2. Sign in with your initial credentials:</p>")
                    .append("<p><strong>Login Email:</strong> ").append(loginEmail).append("<br>")
                    .append("<strong>Temporary Password:</strong> ").append(password).append("</p>")
                    .append("<p style='text-align:center;'><a href='").append(loginUrl).append("' class='button'>Login Now</a></p>")
                    .append("<p><strong>Secure & Personalize Your Profile:</strong></p>")
                    .append("<p>During your first login, you will be prompted to create a new, private password and verify your details. This essential step not only secures your account but also helps the AI tailor its recommendations to your unique career goals. For your protection, please do not share your login details with anyone.</p>")
                    .append("<p> </p>")
                    .append("<p><strong>We're Here to Help:</strong></p>")
                    .append("<p>Should you have any questions or need assistance, please feel free to contact the ").append(schoolOrCompany).append(" Career Center or the system administrator. We are eager to support your career journey.</p>")
                    .append("<p> </p>")
                    .append("<p>Best regards,</p>")
                    .append("<p>The ").append(schoolOrCompany).append(" Career Center Team</p>");
            sb.append("</div>");
//                    .append("<div class='footer'>Pelegant System | Automatically generated, please do not reply | ")
//                    .append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
//                    .append("</div></div></body></html>");
            return sb.toString();
        }

        // 针对TEACHER_INITIAL_PASSWORD和ADMIN_INITIAL_PASSWORD的邮件内容
        if (emailType == EmailType.TEACHER_INITIAL_PASSWORD || emailType == EmailType.ADMIN_INITIAL_PASSWORD) {
            sb.append("<div class='container'>")
                    .append("<div class='header'>Welcome to the Pelegant System</div>")
                    .append("<div class='content'>").append("<p> </p>")
                    .append("<p>Hello ").append(recipientName).append(",</p>")
                    .append("<p>Welcome to the Pelegant system! We are pleased to confirm that your "+userType+" account for ")
                    .append(schoolOrCompany).append(" has been successfully created.</p>")
                    .append("<p>To get started, please log in using the details below:</p>")
                    .append("<p><strong>Login URL:</strong> <a href='http://pelegant.info:8082/login'>http://pelegant.info:8082/login</a></p>")
                    .append("<p><strong>Login Email:</strong> ").append(loginEmail).append("</p>")
                    .append("<p><strong>Temporary Password:</strong> ").append(password).append("</p>")
                    .append("<p style='text-align:center;'><a href='").append(loginUrl).append("' class='button'>Login Now</a></p>")
                    .append("<p> For security purposes, you will be required to change your password immediately after your first login.</p>")
                    .append("<p>If you have any questions or need assistance, please do not hesitate to contact our support team at mike@pelegant.pro.</p>")
                    .append("<p>Best regards,</p>")
                    .append("<p>The Pelegant Team</p>");
            sb.append("</div>");
//                    .append("<div class='footer'>Pelegant System | Automatically generated, please do not reply | ")
//                    .append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
//                    .append("</div></div></body></html>");
            return sb.toString();
        }

        if (emailType == EmailType.PROJECT_ADMIN_INITIAL_PASSWORD) {
            sb.append("<div class='container'>")
                    .append("<div class='header'>Welcome to the Pelegant System</div>")
                    .append("<div class='content'>").append("<p> </p>")
                    .append("<p>Hello ").append(recipientName).append(",</p>")
                    .append("<p>Welcome to the Pelegant system! We are pleased to confirm that your "+userType+" account for ")
                    .append(schoolOrCompany).append(" has been successfully created.</p>")
                    .append("<p>To get started, please log in using the details below:</p>")
                    .append("<p><strong>Login URL:</strong> <a href='http://pelegant.info:8083/login'>http://pelegant.info:8083/login</a></p>")
                    .append("<p><strong>Login Email:</strong> ").append(loginEmail).append("</p>")
                    .append("<p><strong>Temporary Password:</strong> ").append(password).append("</p>")
                    .append("<p style='text-align:center;'><a href='").append(loginUrl).append("' class='button'>Login Now</a></p>")
                    .append("<p> For security purposes, you will be required to change your password immediately after your first login.</p>")
                    .append("<p>If you have any questions or need assistance, please do not hesitate to contact our support team at mike@pelegant.pro.</p>")
                    .append("<p>Best regards,</p>")
                    .append("<p>The Pelegant Team</p>");
            sb.append("</div>");
//                    .append("<div class='footer'>Pelegant System | Automatically generated, please do not reply | ")
//                    .append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
//                    .append("</div></div></body></html>");
            return sb.toString();
        }





        // 添加额外说明，如果有的话
        if (extraNote != null) {
            sb.append("<p>").append(extraNote).append("</p>");
        } else {
            sb.append("<p>Welcome to the Pelegant system! Your ").append(userType.toLowerCase()).append(" account has been successfully created.</p>");
        }



//         密码重置相关内容
        if (emailType == EmailType.PASSWORD_RESET) {
            sb.append("<div class='container'>")
                    .append("<div class='content'>").append("<p> </p>")
                    .append("<p>Hello ").append(recipientName).append(",</p>")
                    .append("<p> </p>")
                    .append("We received a request to reset the password for your account associated with this email address")
                    .append("<p>Your password has been reset successfully. Please use the new password above to log in.</p>")
                    .append("<p><strong>Login Email:</strong> ").append(loginEmail).append("<br>")
                    .append("<strong>Initial Password:</strong> ").append(password).append("<br>")
                    .append("<p style='text-align:center;'><a href='").append(loginUrl).append("' class='button'>Login Now</a></p>")
                    .append("<p>lf you didn't ask to reset your password, you can safely ignore this email. </p>")
                    .append("<p>Best regards,</p>")
                    .append("<p>The Pelegant Team</p>");
            sb.append("</div>");
            return sb.toString();
        }

//        if (emailType == EmailType.PASSWORD_RESET) {
//            sb.append("<!DOCTYPE html>")
//                    .append("<html lang='en'>")
//                    .append("<head>")
//                    .append("<meta charset='UTF-8'>")
//                    .append("<meta name='viewport' content='width=device-width, initial-scale=1.0'>")
//                    .append("<title>Password Reset</title>")
//                    .append("<style>")
//                    .append("body {font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f4f4f4;}")
//                    .append(".container {width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);}")
//                    .append(".header {text-align: center; padding-bottom: 20px;}")
//                    .append(".header img {max-width: 150px;}")
//                    .append(".content {text-align: left;}")
//                    .append(".button {display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;}")
//                    .append(".footer {margin-top: 20px; font-size: 0.9em; color: #777777; text-align: center;}")
//                    .append(".warning {font-size: 0.9em; color: #555555;}")
//                    .append("</style>")
//                    .append("</head>")
//                    .append("<body>")
//                    .append("<div class='container'>")
//                    .append("<div class='header'><img src='[Link to Your Company Logo]' alt='Pelegant Logo'></div>")
//                    .append("<div class='content'>")
//                    .append("<h2>Password Reset Request</h2>")
//                    .append("<p>Hello ").append(recipientName).append(",</p>")
//                    .append("<p>We received a request to reset the password for your account associated with this email address. To proceed, please click the button below:</p>")
//                    .append("<p style='text-align: center;'><a href='").append("http://pelegant.info:8082/login").append("' class='button'>Reset Your Password</a></p>")
//                    .append("<p class='warning'>For your security, this link will expire in 60 minutes. If you did not request a password reset, please ignore this email or contact our support team if you have any concerns. No changes will be made to your account.</p>")
//                    .append("<p>If you're having trouble with the button above, you can copy and paste the following URL into your web browser:</p>")
//                    .append("<p>").append("http://pelegant.info:8082/login").append("</p>")
//                    .append("<p>Thank you,<br>The Pelegant Team</p>")
//                    .append("</div>")
//                    .append("<div class='footer'>")
//                    .append("<p>&copy; ").append(LocalDateTime.now().getYear()).append(" Pelegant. All rights reserved.</p>")
//                    .append("<p>[Your Company Address]</p>")
//                    .append("<p>If you need assistance, please contact our support team at [Support Email Address] or visit our <a href='[Link to Support Page]'>Help Center</a>.</p>")
//                    .append("</div>")
//                    .append("</div>")
//                    .append("</body>")
//                    .append("</html>");
//        }

//        sb.append("</div>")
//                .append("<div class='footer'>Pelegant System | Automatically generated, please do not reply | ")
//                .append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
//                .append("</div></div></body></html>");
        return sb.toString();
    }

    /**
     *HTML重置密码链接邮件
     */
    private String passwordresetlink(String recipientName, String loginEmail,
                                     String schoolOrCompany, String resetLink) {
        java.util.Calendar calendar = java.util.Calendar.getInstance();
        int year = calendar.get(java.util.Calendar.YEAR);

        StringBuilder sb = new StringBuilder();

        sb.append("<!DOCTYPE html>")
                .append("<html lang='en'>")
                .append("<head>")
                .append("<meta charset='UTF-8'>")
                .append("<meta name='viewport' content='width=device-width, initial-scale=1.0'>")
                .append("<title>Password Reset</title>")
                .append("<style>")
                .append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f4f4f4; }")
                .append(".container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }")
                .append(".header { text-align: center; padding-bottom: 20px; }")
                .append(".header img { max-width: 150px; }")
                .append(".content { text-align: left; }")
                .append(".button { display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }")
                .append(".footer { margin-top: 20px; font-size: 0.9em; color: #777777; text-align: center; }")
                .append(".warning { font-size: 0.9em; color: #555555; }")
                .append("</style>")
                .append("</head>")
                .append("<body>")
                .append("<div class='container'>")
                .append("<div class='header'>")
                .append("</div>")
                .append("<div class='content'>")
                .append("<h2>Password Reset Request</h2>")
                .append("<p>Hello ").append(recipientName).append(",</p>")
                .append("<p>We received a request to reset the password for your account associated with this email address. To proceed, please click the button below:</p>")
                .append("<p style='text-align: center;'>")
                .append("<a href='").append(resetLink).append("' class='button'>Reset Your Password</a>")
                .append("</p>")
                .append("<p class='warning'>For your security, this link will expire in 5 minutes. If you did not request a password reset, please ignore this email or contact our support team.</p>")
                .append("<p>If you're having trouble with the button above, you can copy and paste the following URL into your web browser:</p>")
                .append("<p>").append(resetLink).append("</p>")
                .append("<p>Thank you,<br>The Pelegant Team</p>")
                .append("</div>")
                .append("<div class='footer'>")
                .append("<p>&copy; ").append(year).append(" The Pelegant Team. All rights reserved.</p>")
                .append("<p>The Pelegant Team</p>")
                .append("<p>If you need assistance, please contact our support team at mike@pelegant.pro .</p>")
                .append("</div>")
                .append("</div>")
                .append("</body>")
                .append("</html>");

        return sb.toString();
    }
    private String studentpasswordresetlink(String studentName, String studentEmail,
                                     String schoolName, String resetLink) {
        java.util.Calendar calendar = java.util.Calendar.getInstance();
        int year = calendar.get(java.util.Calendar.YEAR);

        StringBuilder sb = new StringBuilder();

        sb.append("<!DOCTYPE html>")
                .append("<html lang='en'>")
                .append("<head>")
                .append("<meta charset='UTF-8'>")
                .append("<meta name='viewport' content='width=device-width, initial-scale=1.0'>")
                .append("<title>Password Reset Request</title>")
                .append("<style>")
                .append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f4f4f4; }")
                .append(".container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }")
                .append(".header { text-align: center; padding-bottom: 20px; }")
                .append(".header img { max-width: 150px; }")
                .append(".content { text-align: left; }")
                .append(".button { display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }")
                .append(".footer { margin-top: 20px; font-size: 0.9em; color: #777777; text-align: center; }")
                .append(".warning { font-size: 0.9em; color: #555555; }")
                .append("</style>")
                .append("</head>")
                .append("<body>")
                .append("<div class='container'>")
                .append("<div class='header'>")
                .append("</div>")
                .append("<div class='content'>")
                .append("<h2>Password Reset Request</h2>")
                .append("<p>Dear ").append(studentName).append(",</p>")
                .append("<p>We received a request to reset the password for your account at ").append(schoolName).append(" associated with the email address ").append(studentEmail).append(". To proceed, please click the button below:</p>")
                .append("<p style='text-align: center;'>")
                .append("<a href='").append(resetLink).append("' class='button'>Reset Your Password</a>")
                .append("</p>")
                .append("<p class='warning'>For your security, this link will expire in 5 minutes. If you did not request a password reset, please ignore this email or contact our support team.</p>")
                .append("<p>If you're having trouble with the button above, you can copy and paste the following URL into your web browser:</p>")
                .append("<p>").append(resetLink).append("</p>")
                .append("<p>Thank you,<br>The ").append(schoolName).append(" Team</p>")
                .append("</div>")
                .append("<div class='footer'>")
                .append("<p>&copy; ").append(year).append(" ").append(schoolName).append(". All rights reserved.</p>")
                .append("<p>If you need assistance, please contact our support team at support@").append(schoolName.toLowerCase()).append(".edu.</p>")
                .append("</div>")
                .append("</div>")
                .append("</body>")
                .append("</html>");

        return sb.toString();
    }

/**
 * 处理邮件发送结果
 */
public boolean handleEmailResult(Future<Boolean> emailFuture, String email) {
    try {
        // 等待邮件发送结果，设置合理的超时时间
        boolean emailSent = emailFuture.get(10, TimeUnit.SECONDS);
        if (!emailSent) {
            log.warn("邮件发送失败: {}", email);
        }
        return emailSent;
    } catch (TimeoutException e) {
        log.warn("邮件发送超时: {}", email);
        // 可以考虑取消任务
        emailFuture.cancel(true);
        return false;
    } catch (Exception e) {
        log.error("邮件发送异常: {}", email, e);
        return false;
    }
}

    @PreDestroy
    public void shutdown() {
        if (executorService != null) {
            log.info("正在关闭邮件发送线程池...");
            executorService.shutdown();
            try {
                // 等待最多60秒让现有任务完成
                if (!executorService.awaitTermination(60, TimeUnit.SECONDS)) {
                    log.warn("邮件发送线程池未能在60秒内关闭，强制关闭...");
                    executorService.shutdownNow();
                    // 再等待60秒让任务响应中断
                    if (!executorService.awaitTermination(60, TimeUnit.SECONDS)) {
                        log.error("邮件发送线程池未能关闭");
                    }
                }
            } catch (InterruptedException e) {
                log.error("关闭邮件发送线程池时被中断", e);
                executorService.shutdownNow();
                Thread.currentThread().interrupt();
            }
            log.info("邮件发送线程池已关闭");
        }
    }
}

