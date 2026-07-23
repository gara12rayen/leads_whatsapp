-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : jeu. 23 juil. 2026 à 16:20
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `leads_whatsapp`
--

-- --------------------------------------------------------

--
-- Structure de la table `admins`
--

CREATE TABLE `admins` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `numTel` varchar(20) NOT NULL,
  `codePostal` varchar(10) NOT NULL,
  `email` varchar(150) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `admins`
--

INSERT INTO `admins` (`id`, `nom`, `prenom`, `numTel`, `codePostal`, `email`, `created_at`, `updated_at`) VALUES
(1, 'Martin', 'Sophie', '+33600000001', '75001', 'admin@societe.com', '2026-07-21 09:21:38', '2026-07-21 09:21:38');

-- --------------------------------------------------------

--
-- Structure de la table `conversations`
--

CREATE TABLE `conversations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `dateDebut` timestamp NOT NULL DEFAULT current_timestamp(),
  `statut` varchar(20) NOT NULL DEFAULT 'EN_COURS' COMMENT 'EN_COURS | FERMEE | CHAUDE',
  `prospect_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `conversations`
--

INSERT INTO `conversations` (`id`, `dateDebut`, `statut`, `prospect_id`, `created_at`, `updated_at`) VALUES
(1, '2026-07-21 09:21:38', 'EN_COURS', 1, '2026-07-21 09:21:38', '2026-07-21 09:21:38'),
(2, '2026-07-21 09:21:38', 'FERMEE', 2, '2026-07-21 09:21:38', '2026-07-21 09:21:38'),
(3, '2026-07-21 09:21:38', 'CHAUDE', 3, '2026-07-21 09:21:38', '2026-07-21 09:21:38');

-- --------------------------------------------------------

--
-- Structure de la table `interactions`
--

CREATE TABLE `interactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `score` double NOT NULL DEFAULT 0,
  `conversation_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `interactions`
--

INSERT INTO `interactions` (`id`, `score`, `conversation_id`, `created_at`, `updated_at`) VALUES
(1, 35, 1, '2026-07-21 09:21:38', '2026-07-21 09:21:38'),
(2, 82.5, 2, '2026-07-21 09:21:38', '2026-07-21 09:21:38'),
(3, 61, 3, '2026-07-21 09:21:38', '2026-07-21 09:21:38');

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

CREATE TABLE `messages` (
  `idMessage` bigint(20) UNSIGNED NOT NULL,
  `contenu` text NOT NULL,
  `conversation_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `messages`
--

INSERT INTO `messages` (`idMessage`, `contenu`, `conversation_id`, `created_at`, `updated_at`) VALUES
(1, 'Bonjour, j\'ai vu votre vidéo sur TikTok', 1, '2026-07-21 09:21:38', '2026-07-21 09:21:38'),
(2, 'Je suis intéressé par la formation', 1, '2026-07-21 09:21:38', '2026-07-21 09:21:38'),
(3, 'Quel est le prix ?', 1, '2026-07-21 09:21:38', '2026-07-21 09:21:38'),
(4, 'Bonjour, je veux en savoir plus', 2, '2026-07-21 09:21:38', '2026-07-21 09:21:38'),
(5, 'Pouvez-vous m\'appeler ?', 3, '2026-07-21 09:21:38', '2026-07-21 09:21:38');

-- --------------------------------------------------------

--
-- Structure de la table `produits`
--

CREATE TABLE `produits` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(150) NOT NULL,
  `quantite` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `prix` decimal(10,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `societe_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `produits`
--

INSERT INTO `produits` (`id`, `nom`, `quantite`, `prix`, `description`, `societe_id`, `created_at`, `updated_at`) VALUES
(1, 'Formation WhatsApp Ads', 50, 297.00, NULL, 1, '2026-07-21 09:21:38', '2026-07-21 09:21:38'),
(2, 'Coaching Lead Generation', 10, 997.00, NULL, 1, '2026-07-21 09:21:38', '2026-07-21 09:21:38');

-- --------------------------------------------------------

--
-- Structure de la table `prospects`
--

CREATE TABLE `prospects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nomComplet` varchar(200) NOT NULL,
  `numTelephone` varchar(20) NOT NULL,
  `Email` varchar(150) DEFAULT NULL,
  `statut` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 = non qualifié, 1 = qualifié',
  `societe_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `prospects`
--

INSERT INTO `prospects` (`id`, `nomComplet`, `numTelephone`, `Email`, `statut`, `societe_id`, `created_at`, `updated_at`) VALUES
(1, 'Ahmed Benali', '+21655000001', 'ahmed@mail.com', 0, 1, '2026-07-21 09:21:38', '2026-07-21 09:21:38'),
(2, 'Sara Trabelsi', '+21655000002', 'sara@mail.com', 1, 1, '2026-07-21 09:21:38', '2026-07-21 09:21:38'),
(3, 'Karim Mansour', '+21655000003', 'karim@mail.com', 0, 1, '2026-07-21 09:21:38', '2026-07-21 09:21:38');

-- --------------------------------------------------------

--
-- Structure de la table `societes`
--

CREATE TABLE `societes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(150) NOT NULL,
  `adresse` varchar(255) NOT NULL,
  `domaine` varchar(100) NOT NULL,
  `admin_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `societes`
--

INSERT INTO `societes` (`id`, `nom`, `adresse`, `domaine`, `admin_id`, `created_at`, `updated_at`) VALUES
(1, 'Ma Société', '12 rue de la Paix, Paris', 'Marketing Digital', 1, '2026-07-21 09:21:38', '2026-07-21 09:21:38');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Index pour la table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conversations_prospect` (`prospect_id`),
  ADD KEY `idx_conversations_statut` (`statut`);

--
-- Index pour la table `interactions`
--
ALTER TABLE `interactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_interactions_conversation` (`conversation_id`);

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`idMessage`),
  ADD KEY `idx_messages_conversation` (`conversation_id`);

--
-- Index pour la table `produits`
--
ALTER TABLE `produits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_produits_societe` (`societe_id`);

--
-- Index pour la table `prospects`
--
ALTER TABLE `prospects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numTelephone` (`numTelephone`),
  ADD KEY `idx_prospects_telephone` (`numTelephone`),
  ADD KEY `idx_prospects_statut` (`statut`),
  ADD KEY `fk_prospects_societe` (`societe_id`);

--
-- Index pour la table `societes`
--
ALTER TABLE `societes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_societes_admin` (`admin_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `interactions`
--
ALTER TABLE `interactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `messages`
--
ALTER TABLE `messages`
  MODIFY `idMessage` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `produits`
--
ALTER TABLE `produits`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `prospects`
--
ALTER TABLE `prospects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `societes`
--
ALTER TABLE `societes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `fk_conversations_prospect` FOREIGN KEY (`prospect_id`) REFERENCES `prospects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `interactions`
--
ALTER TABLE `interactions`
  ADD CONSTRAINT `fk_interactions_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `produits`
--
ALTER TABLE `produits`
  ADD CONSTRAINT `fk_produits_societe` FOREIGN KEY (`societe_id`) REFERENCES `societes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `prospects`
--
ALTER TABLE `prospects`
  ADD CONSTRAINT `fk_prospects_societe` FOREIGN KEY (`societe_id`) REFERENCES `societes` (`id`) ON UPDATE CASCADE;

--
-- Contraintes pour la table `societes`
--
ALTER TABLE `societes`
  ADD CONSTRAINT `fk_societes_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
