package com.x.pelegant.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
@Controller
@RequestMapping("/page")
public class PageController {
    @Autowired
    private StringRedisTemplate redisTemplate;

    private static final String RESET_KEY_PREFIX = "teacher_reset_token:";

    @GetMapping("/reset-password")
    public String showResetPasswordPage(@RequestParam String token, Model model) {
        String teacherId = redisTemplate.opsForValue().get(RESET_KEY_PREFIX + token);
        if (teacherId == null) {
            model.addAttribute("token", "");
            model.addAttribute("errorMessage", "链接已过期或无效");
        } else {
            model.addAttribute("token", token);
        }
        return "reset-password";
    }
    @GetMapping("/student-reset-password")
    public String studentshowResetPasswordPage(@RequestParam String token, Model model) {
        String teacherId = redisTemplate.opsForValue().get(RESET_KEY_PREFIX + token);
        if (teacherId == null) {
            model.addAttribute("token", "");
            model.addAttribute("errorMessage", "链接已过期或无效");
        } else {
            model.addAttribute("token", token);
        }
        return "student-reset-password";
    }
}
