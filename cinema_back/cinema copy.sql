/*
 Navicat Premium Data Transfer

 Source Server         : 111
 Source Server Type    : MySQL
 Source Server Version : 80034
 Source Host           : localhost:3306
 Source Schema         : cinema

 Target Server Type    : MySQL
 Target Server Version : 80034
 File Encoding         : 65001

 Date: 01/04/2025 14:43:07
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for movie
-- ----------------------------
DROP TABLE IF EXISTS `movie`;
CREATE TABLE `movie` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `director` varchar(100) NOT NULL,
  `actors` text NOT NULL,
  `duration` int NOT NULL,
  `release_date` date NOT NULL,
  `poster_url` varchar(200) NOT NULL,
  `rating` decimal(3,1) NOT NULL DEFAULT 0.0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_release_date` (`release_date`),
  KEY `idx_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of movie
-- ----------------------------
INSERT INTO `movie` VALUES 
(1, '复仇者联盟4', '终局之战，复仇者联盟的最后集结。', '安东尼·罗素', '小罗伯特·唐尼,克里斯·埃文斯', 181, '2019-04-24', 'https://cdn.jsdelivr.net/gh/Elysiamobi/images/imageFiles/202504011355512.jpg', 4.8, NOW(), NOW()),
(2, '泰坦尼克号', '永恒的爱情故事。', '詹姆斯·卡梅隆', '莱昂纳多·迪卡普里奥,凯特·温丝莱特', 194, '1997-12-19', 'https://cdn.jsdelivr.net/gh/Elysiamobi/images/imageFiles/202504011355512.jpg', 4.9, NOW(), NOW()),
(3, '盗梦空间', '在梦境中穿梭的科幻巨作。', '克里斯托弗·诺兰', '莱昂纳多·迪卡普里奥,约瑟夫·高登-莱维特', 148, '2010-07-16', 'https://cdn.jsdelivr.net/gh/Elysiamobi/images/imageFiles/202504011355512.jpg', 4.7, NOW(), NOW()),
(4, '星际穿越', '探索宇宙奥秘的科幻史诗。', '克里斯托弗·诺兰', '马修·麦康纳,安妮·海瑟薇', 169, '2014-11-07', 'https://cdn.jsdelivr.net/gh/Elysiamobi/images/imageFiles/202504011355512.jpg', 4.9, NOW(), NOW());

-- ----------------------------
-- Table structure for screening
-- ----------------------------
DROP TABLE IF EXISTS `screening`;
CREATE TABLE `screening` (
  `id` int NOT NULL AUTO_INCREMENT,
  `movie_id` int NOT NULL,
  `theater` varchar(100) NOT NULL,
  `hall` varchar(50) NOT NULL,
  `screening_time` datetime NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_movie_id` (`movie_id`),
  KEY `idx_screening_time` (`screening_time`),
  KEY `idx_theater_hall` (`theater`, `hall`),
  CONSTRAINT `fk_screening_movie` FOREIGN KEY (`movie_id`) REFERENCES `movie` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of screening
-- ----------------------------
INSERT INTO `screening` VALUES 
(1, 1, '万达影城', '1号厅', '2025-04-30 14:00:00', 45.00, NOW(), NOW()),
(2, 1, '万达影城', '2号厅', '2025-04-30 17:30:00', 45.00, NOW(), NOW()),
(3, 2, '万达影城', '3号厅', '2025-04-30 15:00:00', 35.00, NOW(), NOW()),
(4, 3, '万达影城', '4号厅', '2025-04-30 16:30:00', 40.00, NOW(), NOW()),
(5, 4, '万达影城', '5号厅', '2025-04-30 19:00:00', 40.00, NOW(), NOW()),
(6, 1, '万达影城', '1号厅', '2025-04-01 14:00:00', 45.00, NOW(), NOW()),
(7, 2, '万达影城', '2号厅', '2025-04-01 15:30:00', 35.00, NOW(), NOW()),
(8, 3, '万达影城', '3号厅', '2025-04-01 17:00:00', 40.00, NOW(), NOW()),
(9, 4, '万达影城', '4号厅', '2025-04-01 19:30:00', 40.00, NOW(), NOW());

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(80) NOT NULL,
  `password` varchar(120) NOT NULL,
  `email` varchar(120) NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES 
(1, 'admin', 'admin123', 'admin@example.com', 1, NOW(), NOW()),
(2, 'user1', 'user123', 'user1@example.com', 0, NOW(), NOW()),
(3, 'user2', 'user123', 'user2@example.com', 0, NOW(), NOW()),
(4, 'user3', 'user123', 'user3@example.com', 0, NOW(), NOW()),
(5, 'yangcheng', '123456', '22@qw.com', 0, NOW(), NOW());

-- ----------------------------
-- Table structure for order
-- ----------------------------
DROP TABLE IF EXISTS `order`;
CREATE TABLE `order` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `screening_id` int NOT NULL,
  `seats` json NOT NULL,
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_screening_id` (`screening_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_order_screening` FOREIGN KEY (`screening_id`) REFERENCES `screening` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of order
-- ----------------------------
INSERT INTO `order` VALUES 
(1, 2, 1, '["A1", "A2"]', 90.00, 'confirmed', NOW(), NOW()),
(2, 2, 3, '["B3", "B4"]', 70.00, 'completed', NOW(), NOW()),
(3, 3, 2, '["C5", "C6"]', 90.00, 'pending', NOW(), NOW()),
(4, 4, 4, '["D7", "D8"]', 80.00, 'confirmed', NOW(), NOW()),
(5, 2, 5, '["E9", "E10"]', 80.00, 'completed', NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;
