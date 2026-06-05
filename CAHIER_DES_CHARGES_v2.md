# HOME SENTINEL — Cahier des Charges Technique
### Version 2.0 · Juin 2026 · Lylia · Z Code Digital Solutions · Évreux, Normandie
> **Confidentiel** — Remplace la version 1.0 (Mai 2026).

---

## 0. À quoi ça sert — et pourquoi ce projet existe

### 0.1 Le problème

Les systèmes de sécurité commerciaux (Somfy, Ajax, Ring, Arlo…) ont tous le même point commun : **ils dépendent d'un cloud tiers**. Tes données partent chez un opérateur qui peut fermer son service, augmenter ses prix, se faire pirater, ou simplement décider que ton abonnement ne couvre plus telle fonctionnalité. Tu paies pour utiliser ta propre caméra chez toi, et tu n'as aucun contrôle réel sur ce qui se passe avec les images de ta maison.

En plus, ces systèmes sont des boîtes noires. Tu ne sais pas ce qui tourne dessus, tu ne peux pas les auditer, tu ne peux pas les étendre.

### 0.2 La réponse apportée

Home Sentinel est la réponse directe à ce problème : un système de sécurité **entièrement auto-hébergé**, qui tourne sur un matériel que tu possèdes physiquement (Raspberry Pi 5), dans ta maison, sur ton réseau.

- **Zéro dépendance cloud** : pas d'abonnement, pas de compte tiers obligatoire, pas de données envoyées à l'extérieur
- **Zéro boîte noire** : tout le code est écrit par toi, auditable, modifiable
- **Zéro port ouvert sur Internet** : l'accès distant se fait uniquement via WireGuard (VPN chiffré de bout en bout)
- **Alertes en temps réel** via Telegram — le seul service externe, et uniquement en sortie

### 0.3 Ce que le système fait concrètement

| Situation | Ce que fait Home Sentinel |
|---|---|
| Quelqu'un entre dans la maison | Caméra déclenche la reconnaissance faciale + liveness check |
| Visage inconnu ou spoofing détecté | Alerte Telegram instantanée avec photo, son d'alerte |
| Retour à la maison autorisé | Message vocal de bienvenue (Piper TTS), porte journalisée |
| Courrier dans la boîte aux lettres | Notification Telegram automatique (poids détecté) |
| Appareil inconnu sur le réseau WiFi | Alerte réseau dans le dashboard |
| Tu es absent et tu veux vérifier | Commande /photo sur Telegram → capture immédiate |
| Tablette en entrée | Code PIN 6 chiffres, statut armé/désarmé, météo, agenda |
| Tablette au bureau | Dashboard complet : capteurs, alertes, logs, santé Pi, réseau |

### 0.4 Pourquoi construire ça soi-même

**Raison 1 — Souveraineté numérique.**
Quand le système de sécurité est auto-hébergé, tu es le seul à avoir accès aux données. Pas de CGU à accepter, pas de revente de données, pas de risque de fermeture de service.

**Raison 2 — Extensibilité réelle.**
Un système commercial ne fera jamais ce que tu n'as pas payé. Home Sentinel est extensible à l'infini : demain tu peux ajouter la reconnaissance d'iris pour un coffre, un cluster K3s, un honeypot réseau, un SIEM, ou une intégration Home Assistant. La limite c'est ton imagination, pas un pricing tier.

**Raison 3 — Apprentissage par la pratique.**
Construire ce système, c'est appliquer concrètement des compétences qui restent souvent abstraites en formation :
- Administration Linux et scripting système
- Développement backend (FastAPI, WebSocket, JWT, bcrypt)
- Développement frontend React (composants, routing, animations)
- Protocoles IoT (MQTT, GPIO, ESP32 deep sleep)
- Computer vision et IA embarquée (OpenCV, YuNet, MediaPipe)
- Cybersécurité appliquée (audit, TLS, fail2ban, CSP, hash, chiffrement)
- Infrastructure réseau (WireGuard, Nginx, reverse proxy, pare-feu)

### 0.5 À qui s'adresse ce document

Ce cahier des charges est à la fois :

- **Un contrat technique** : il définit ce qui doit être construit, comment, et avec quelles contraintes de sécurité
- **Un document de référence** : il est mis à jour à chaque décision importante et peut être relu en cas de doute sur une implémentation
- **Un élément de portfolio** : il démontre la capacité à formaliser un projet technique complexe, à anticiper les risques, et à prendre des décisions d'architecture argumentées

Il m'est destiné Lylia développeuse et administratrice du système en apprentissage et, à terme, à tout recruteur ou jury qui évaluerait le projet dans le cadre d'une certification.

---

## 1. Présentation du projet

### 1.1 Contexte

HOME SENTINEL est un système de sécurité maison intelligent, entièrement auto-hébergé,
développé de A à Z sur Raspberry Pi 5. Le projet couvre la détection de présence, la
reconnaissance faciale avec **détection de liveness (anti-spoofing)**, l'authentification par code et
par phrase vocale, les alertes en temps réel, et un dashboard multi-rôles accessible depuis des
tablettes.

Ce projet a deux objectifs complémentaires :
- Créer une infrastructure de sécurité maison fonctionnelle et évolutive
- Constituer un projet portfolio technique couvrant les compétences systèmes, réseau,
développement et cybersécurité

### 1.2 Objectifs

- Détecter et identifier toute entrée dans les zones surveillées
- Permettre l'authentification par code **(6 chiffres)** et par phrase secrète vocale
- Déclencher des alertes Telegram avec photo en cas d'accès non autorisé
- Offrir un dashboard USER (tablette entrée) et ADMIN (tablette bureau/téléphone)
- Fonctionner 24h/24 sans intervention, avec démarrage automatique
- Être extensible : domotique, IA locale, cluster, SIEM

### 1.3 Périmètre

| Zone | Capteurs | Authentification | Actions |
|---|---|---|---|
| Entrée principale | Magnétique + PIR + Caméra | **Code numérique 6 chiffres** | Voix, alerte, log |
| Bureau / Chambre | Magnétique + PIR + Caméra | Phrase secrète vocale **+ détection liveness** | Voix, alerte, tâches du jour |
| Boîte aux lettres | **Poids (ESP32 + cellule de charge HX711)** | Aucune | Notification Telegram |
| Réseau maison | Monitoring passif | Aucune | Alerte appareil inconnu |

---

## 2. Architecture technique

### 2.1 Vue globale

Le système repose sur une architecture centralisée. Le Raspberry Pi 5 est le cerveau
unique. Les nœuds ESP32 sont des capteurs sans fil sur batterie. Les tablettes sont des
clients légers qui affichent des pages web servies par le Pi.

| Composant | Rôle | Connexion |
|---|---|---|
| Raspberry Pi 5 | Serveur central, logique, API, voix | Ethernet (Livebox Max) |
| ESP32 x5 | Capteurs terrain sans fil | Wi-Fi + **MQTT TLS (port 8883)** |
| Caméra Pi NoIR | Capture, **détection faciale + liveness** | Câble ruban CSI |
| Tablette entrée | Interface USER — code + infos jour | Wi-Fi → IP locale Pi |
| Tablette admin | Interface ADMIN — dashboard complet | Wi-Fi → IP locale Pi |
| Téléphone | Alertes Telegram | Internet via WireGuard |

### 2.2 Réseau

- Box : Livebox - IPv4 + IPv6 avec pare-feu activé
- Pi fixé en **IP statique à définir** (réservation DHCP par adresse MAC une fois le Pi reçu)
- ESP32 : IPs dynamiques DHCP, communicant via **MQTT TLS sur port 8883** (broker Mosquitto du Pi)
- Tablettes : Wi-Fi, pointent sur l'IP locale du Pi en mode kiosque (Fully Kiosk Browser)
- Accès externe : tunnel WireGuard sur le Pi — aucun port ouvert directement

### 2.3 Flux de données

Le flux principal lors d'un événement de sécurité :
1. ESP32 détecte l'ouverture de porte → publie sur topic MQTT `sentinel/zone/entree`
2. Pi reçoit via Mosquitto → déclenche la logique Python
3. Caméra capture → **YuNet détecte le visage → liveness check (clignement yeux) → SFace compare l'embedding**
4. Piper TTS génère la réponse vocale → lecture sur HP USB
5. FastAPI envoie l'événement via WebSocket aux tablettes connectées
6. Si inconnu → python-telegram-bot envoie photo + alerte
7. SQLite enregistre l'événement avec horodatage, statut et **hash d'intégrité SHA-256 chaîné**

---

## 3. Matériel

### 3.1 Liste complète

| Composant | Modèle | Prix estimé | Où acheter |
|---|---|---|---|
| Raspberry Pi 5 | 4 Go RAM | ~80 € | Kubii.com |
| Alimentation Pi 5 | Officielle 27W USB-C | ~12 € | Kubii.com |
| Carte micro SD | SanDisk 64 Go Class 10 | ~10 € | Amazon FR |
| Caméra | Pi Camera Module 3 NoIR | ~25 € | Kubii.com |
| ESP32 x5 | ESP32 WROOM-32 (pack) | ~20 € | AliExpress |
| Capteur magnétique x5 | Reed switch MC-38 | ~5 € | Amazon FR |
| Capteur PIR x3 | HC-SR501 | ~6 € | Amazon FR |
| LED IR x5 | 850nm 5mm | ~4 € | Amazon FR |
| Servo moteur | SG90 | ~6 € | Amazon FR |
| HP USB mini | Avec micro intégré | ~15 € | Amazon FR |
| Câbles jumper kit | M/F 40 pcs | ~5 € | Amazon FR |
| Breadboard | 830 points | ~5 € | Amazon FR |
| **Cellule de charge HX711** | **50g ou 1kg selon boîte** | **~5 €** | **Amazon FR** |
| Piles AA x10 | Pour ESP32 | ~8 € | Supermarché |
| LiPo 2000mAh x2 | Boîte aux lettres ext. | ~10 € | Amazon FR |
| Boîtiers ESP32 | Impression 3D ou achetés | ~15 € | Amazon FR |
| **TOTAL** | | **~231 €** | |

### 3.2 Tablettes

Les tablettes ne sont pas incluses dans le budget ci-dessus. Options recommandées :
- Vieille tablette Android disponible : coût nul
- Amazon Fire HD 8 (neuf) : ~60 € — suffisant pour le mode kiosque
- Tablette Android 10+ reconditionnée : ~40–80 €

---

## 4. Stack logicielle complète

### 4.1 Système d'exploitation

| Couche | Technologie | Justification |
|---|---|---|
| OS | Raspberry Pi OS Lite (Debian 12) | Pas d'interface graphique — tout en CLI |
| Gestionnaire paquets | apt + pip3 | Standard Debian |
| Conteneurs | Docker + Docker Compose | Isolation des services, déploiement reproductible |
| Démarrage automatique | systemd services | Relance automatique si crash |

### 4.2 Backend Python

| Bibliothèque | Version | Usage |
|---|---|---|
| FastAPI | 0.111+ | API REST + WebSocket temps réel |
| Uvicorn | 0.30+ | Serveur ASGI pour FastAPI |
| RPi.GPIO | 0.7+ | Lecture capteurs GPIO (magnétique, PIR, servo) |
| Picamera2 | 0.3+ | Interface officielle caméra Pi 5 |
| OpenCV (cv2) | 4.9+ | Traitement image, **YuNet (détection) + SFace (reconnaissance)** |
| **MediaPipe** | **0.10+** | **Détection liveness — Eye Aspect Ratio, maillage facial** |
| ~~face_recognition~~ | ~~1.3+~~ | **Remplacé par YuNet + SFace — 5-10x plus rapide sur ARM** |
| Piper TTS | 1.2+ | Synthèse vocale française offline — voix naturelle |
| Vosk | 0.3+ | Transcription vocale offline — phrase secrète zone bureau |
| **bcrypt** | **4.1+** | **Hachage sécurisé des codes PIN et phrases secrètes** |
| paho-mqtt | 2.0+ | Client **MQTT TLS** pour recevoir les données ESP32 |
| python-telegram-bot | 21+ | Envoi alertes + photos sur Telegram |
| SQLAlchemy | 2.0+ | ORM pour SQLite — logs et événements |
| python-dotenv | 1.0+ | Variables d'environnement (.env) |
| APScheduler | 3.10+ | Tâches planifiées (vérifications, rapports, heartbeat) |
| requests | 2.31+ | Appels API météo (Open-Meteo) |
| **python-jose** | **3.3+** | **JWT — génération et validation des tokens 2h** |
| **passlib** | **1.7+** | **Wrapper bcrypt pour FastAPI** |

> **Pourquoi YuNet + SFace plutôt que face_recognition (dlib) ?**
> dlib est précis mais lent sur ARM (1-2s par frame). YuNet et SFace sont des modèles intégrés
> à OpenCV depuis la version 4.8, optimisés mobile/embedded. Sur Pi 5 : ~15-30ms par frame.
> Pour une porte d'entrée avec un délai d'attente court, c'est la différence entre utilisable et inutilisable.

### 4.3 Détection de liveness (anti-spoofing)

> **Pourquoi ?** Sans liveness, une photo imprimée ou affichée sur un téléphone suffit à bypasser
> la reconnaissance faciale. Attaque triviale, documentée depuis 2011.

**Méthode retenue : défi par clignement (EAR — Eye Aspect Ratio)**
- MediaPipe Face Mesh extrait les landmarks oculaires en temps réel
- Le système calcule l'EAR (rapport hauteur/largeur de l'œil)
- Il demande à la personne de cligner → détecte la variation EAR > seuil
- Un écran/photo ne peut pas cligner → tentative de spoofing détectée → alerte Telegram

**Niveaux de défi :**
1. Clignement simple (défaut)
2. Sourire + clignement (si niveau sécurité élevé activé)
3. Mouvement de tête (phase 9+ optionnel)

### 4.4 ESP32 (microcontrôleurs)

| Technologie | Usage |
|---|---|
| MicroPython 1.22+ | Langage principal sur ESP32 |
| umqtt.simple | Client MQTT ultra léger |
| **umqtt.robust + TLS** | **Connexion MQTT sécurisée (port 8883, certificat CA du Pi)** |
| Deep sleep API | Mise en veille entre événements — autonomie batterie maximale |
| DHT library | Lecture température/humidité DHT22 |
| machine.Pin | Lecture GPIO — capteur magnétique, PIR |
| **HX711 library** | **Lecture cellule de charge — capteur poids boîte aux lettres** |

### 4.5 Infrastructure & messagerie

| Service | Technologie | Rôle |
|---|---|---|
| Broker MQTT | **Mosquitto 2.0 + TLS (port 8883)** | Reçoit tous les messages ESP32 — topics par zone |
| Base de données | SQLite 3 | Logs événements, accès, photos, statuts |
| Reverse proxy | Nginx | Sert le frontend React, proxy vers FastAPI |
| VPN | WireGuard | Accès sécurisé depuis l'extérieur — aucun port ouvert |
| Météo API | Open-Meteo (gratuit, sans clé) | Données météo Évreux — **tablette USER uniquement** |
| Agenda | Google Calendar API ou CalDAV Nextcloud | Récupère les RDV du jour |

### 4.6 Frontend (tablettes)

| Technologie | Usage |
|---|---|
| React 19 + Vite | Framework UI — dashboard admin + vue tablette entrée |
| WebSocket natif | Connexion temps réel au Pi — alertes sans refresh |
| **CSS custom (variables CSS + Framer Motion + GSAP)** | **Style terminal sécurité — remplace Tailwind** |
| Fully Kiosk Browser (Android) | Mode kiosque — plein écran, pas de navigation possible |
| Axios ou fetch natif | Appels API REST vers FastAPI |

---

## 5. Fonctionnalités détaillées

### 5.1 Zone Entrée

**Détection et authentification**
- ESP32 détecte ouverture porte via capteur magnétique reed → topic `sentinel/zone/entree/porte`
- PIR détecte présence dans le couloir → topic `sentinel/zone/entree/pir`
- Caméra Pi NoIR capture — LED IR si luminosité insuffisante
- **YuNet détecte le visage dans le frame**
- **MediaPipe vérifie la liveness (clignement d'yeux demandé)**
- **SFace compare l'embedding facial à la base de visages connus**
- Si personne connue + liveness OK : voix Piper TTS *"Bonjour Lylia, il est 8h30, vous avez 2 rendez-vous aujourd'hui"*
- Si personne inconnue ou liveness échouée : **pavé numérique 6 chiffres** s'affiche sur tablette entrée — 30 secondes pour saisir le code

**Logique alarme**
- Bon code → alarme désactivée, log SUCCESS, caméra en pause 5 minutes
- Mauvais code → alarme continue, log FAIL, photo Telegram, compteur tentatives
- 3 mauvaises tentatives → verrouillage 10 minutes + alerte Telegram prioritaire
- **Liveness échouée (spoofing détecté) → alerte Telegram immédiate + log SPOOFING_ATTEMPT**

### 5.2 Zone Bureau

- Même logique de détection (ESP32 + PIR + caméra + liveness)
- Authentification par phrase secrète vocale via microphone USB
- Vosk ASR transcrit la phrase localement (offline, aucune donnée cloud)
- **bcrypt compare le hash de la phrase transcrite au hash stocké**
- Si phrase correcte + liveness OK : *"Accès autorisé. Vous avez 3 tâches aujourd'hui. Il fait 23 degrés."*
- Si phrase incorrecte ou liveness échouée : *"Accès non autorisé."* + alerte Telegram

### 5.3 Boîte aux lettres

- ESP32 + cellule de charge HX711 — mesure le poids en continu
- Deep sleep entre mesures (autonomie LiPo 2000mAh estimée : 6-12 mois)
- Si poids > seuil configurable (ex: 30g) → notification Telegram : *"Nouveau courrier détecté"*
- Si poids revient à 0 → notification : *"Boîte aux lettres vidée"*
- Topic MQTT : `sentinel/zone/boite/poids`

### 5.4 Dashboard tablette entrée — rôle USER

- **Indicateur état système : ARMÉ / DÉSARMÉ / ALERTE** (visible en grand, en haut)
- **Bouton armer/désarmer** (avec confirmation)
- Pavé numérique **6 chiffres** désactivation alarme
- Feed caméra entrée (lecture seule)
- **Widget météo Évreux — Open-Meteo** (température, conditions, vent)
- Rendez-vous du jour — Google Calendar / Nextcloud
- Tâches du jour (lecture seule)
- Mode kiosque — aucune navigation possible
- Écran s'allume si mouvement PIR détecté, s'éteint après 2 min sans activité

> La tablette USER n'a **pas accès** aux logs complets, blacklist, réseau, gestion avancée.
> C'est une interface opérateur minimaliste — code + statut + infos du jour.

### 5.5 Dashboard tablette admin — rôle ADMIN

- **Indicateur état système : ARMÉ / DÉSARMÉ / ALERTE** (dans le header en permanence)
- **Bouton armer/désarmer** (avec confirmation)
- Tous les feeds caméra en temps réel
- Historique complet des accès avec photos et horodatage
- **Alertes** : critiques, avertissements, infos — avec corrélation vers les logs par IP
- **Journaux** : SSH, externe, admin, Raspberry, système — filtrables, exportables CSV
- **Réseau local** : appareils connus/inconnus, statut connexion
- **Sante RPI** : CPU, RAM, température, disque, uptime
- **Capteurs** : statut par zone, batterie, activation/désactivation individuelle
- **Liste noire** : IPs bloquées (appliquées côté FastAPI via iptables)
- Gestion des zones — activer/désactiver
- **Modification du code PIN et de la phrase secrète** (hash bcrypt re-généré côté serveur)
- Statistiques : accès par jour, tentatives échouées, temps de réponse
- Contrôle manuel des caméras et des servos

> La tablette ADMIN n'affiche **pas** le widget météo — information pertinente uniquement pour
> la tablette d'entrée.

### 5.6 Alertes Telegram

- Bot Telegram dédié
- Alerte immédiate avec photo capturée
- Message formaté : zone, horodatage, statut, miniature photo, **type d'événement (intrusion / spoofing / bruteforce / courrier)**
- **Heartbeat toutes les heures** : *"HOME SENTINEL · ALIVE · CPU 34% · RAM 61%"* (watchdog)
- **Si heartbeat absent 2h → alerte automatique** depuis cron externe
- Commandes bot : `/statut`, `/historique`, `/armer`, `/desarmer`, `/photo`
- **Canal de secours** : email SMTP si Telegram échoue 3 fois de suite

---

## 6. Sécurité

### 6.1 Authentification et accès

- **JWT tokens pour les routes API FastAPI — expiration 2h + refresh token (24h)**
- Rôles USER et ADMIN séparés — routes distinctes protégées par dépendances FastAPI
- **Codes PIN (6 chiffres) et phrases secrètes stockés hashés avec bcrypt** en SQLite
- HTTPS sur toutes les routes via Nginx + certificat auto-signé en local (Let's Encrypt si exposition WireGuard)
- Accès externe uniquement via WireGuard — aucun port exposé directement
- **Détection de liveness obligatoire pour la reconnaissance faciale (anti-spoofing)**
- **Rate limiting sur les endpoints d'authentification** (10 requêtes/minute par IP via FastAPI middleware)

### 6.2 Réseau

- Pare-feu UFW sur le Pi — uniquement ports 80, 443, **8883 (MQTT TLS)**, 51820 (WireGuard)
- **Port 1883 (MQTT non chiffré) fermé** — MQTT uniquement via TLS port 8883
- ESP32 communiquent uniquement avec le Pi en local **via TLS avec certificat CA auto-signé**
- Livebox — pare-feu IPv6 activé — aucun appareil directement exposé

### 6.3 Données

- Photos stockées localement sur Pi — pas de cloud
- **Logs avec hash d'intégrité SHA-256 chaîné** — toute modification casse la chaîne
- Logs SQLite chiffrés avec SQLCipher (phase 2)
- Variables sensibles dans `.env` — jamais dans le code
- Sauvegardes automatiques sur NAS via rsync (si disponible)
- **Rotation des tokens JWT** — refresh token invalidé à chaque renouvellement

### 6.4 Anti-spoofing spécifique

- Reconnaissance faciale seule = insuffisant → liveness obligatoire
- **Niveau 1 (défaut)** : clignement d'yeux détecté dans les 10 secondes
- **Niveau 2 (configurable admin)** : clignement + sourire
- Échec liveness → log `SPOOFING_ATTEMPT` + alerte Telegram + photo capturée
- Après 3 tentatives de spoofing → verrouillage zone 10 minutes

---

## 7. Structure des topics MQTT

```
sentinel/
├── zone/
│   ├── entree/
│   │   ├── porte          # booléen : ouvert/ferme
│   │   ├── pir            # booléen : present/absent
│   │   └── code           # résultat auth : succes/echec/bloque
│   ├── bureau/
│   │   ├── porte
│   │   ├── pir
│   │   └── voix           # résultat auth vocale
│   └── boite/
│       └── poids          # float : poids en grammes
├── systeme/
│   ├── etat               # arme / desarme / alerte
│   ├── heartbeat          # timestamp Unix
│   └── alarme             # declenche / reset
└── capteurs/
    ├── {id}/batterie      # float : pourcentage
    └── {id}/statut        # enligne / horsligne
```

---

## 8. Roadmap de développement

| Phase | Durée | Contenu | Compétences acquises |
|---|---|---|---|
| Phase 1 — OS & SSH | 1 sem | RPi OS Lite, SSH, configuration réseau, **IP statique à définir** | Linux CLI, réseau, SSH |
| Phase 2 — Hardware | 1 sem | GPIO, capteurs magnétiques, PIR, **HX711 boîte aux lettres** | GPIO, électronique, Python |
| Phase 3 — ESP32 | 1 sem | MicroPython, **MQTT TLS**, deep sleep, batterie | IoT, MQTT sécurisé, MicroPython |
| Phase 4 — Caméra & IA | 2 sem | Picamera2, **YuNet + SFace**, **liveness MediaPipe**, Piper TTS | Vision, IA, anti-spoofing |
| Phase 5 — Backend | 2 sem | FastAPI, WebSocket, SQLite, **bcrypt**, **JWT 2h/refresh**, routes USER/ADMIN | API REST, sécurité, SQL |
| Phase 6 — Frontend | 2 sem | React dashboard admin, **vue USER tablette**, **état armé/désarmé** | React, UX, WebSocket |
| Phase 7 — Alertes | 1 sem | Bot Telegram, photos, **heartbeat watchdog**, **canal secours email** | Telegram API, monitoring |
| Phase 8 — Prod | 1 sem | systemd, Nginx, WireGuard, **MQTT TLS production**, tests, docs | Déploiement, sécurité |
| Phase 9+ — Évolutions | Continu | Domotique, LLM local, SIEM, cluster K3s | IA, cybersécurité, DevOps |

---

## 9. Budget

### 9.1 Matériel

| Poste | Coût estimé |
|---|---|
| Raspberry Pi 5 4Go + alimentation | 92 € |
| Carte SD 64 Go | 10 € |
| Caméra Pi NoIR | 25 € |
| ESP32 x5 + capteurs (magnétique, PIR, LED IR) | 35 € |
| **Cellule de charge HX711 (boîte aux lettres)** | **5 €** |
| Servo moteur + câbles + breadboard | 16 € |
| HP USB + micro | 15 € |
| Batteries et boîtiers ESP32 | 25 € |
| **TOTAL MATÉRIEL** | **~223 €** |

### 9.2 Logiciel

L'intégralité de la stack logicielle est open source et gratuite :
- Raspberry Pi OS, Python, FastAPI, OpenCV, **YuNet/SFace, MediaPipe** — gratuit
- MicroPython — gratuit
- Mosquitto, Nginx, WireGuard — gratuit
- React, Vite — gratuit
- Open-Meteo API — gratuit sans clé
- Piper TTS, Vosk — gratuit, offline
- **TOTAL LOGICIEL : 0 €**

### 9.3 Récapitulatif

| Poste | Coût |
|---|---|
| Matériel | ~223 € |
| Logiciel | 0 € |
| Tablettes (si besoin) | 0 – 120 € |
| **TOTAL PROJET** | **~223 – 343 €** |

---

## 10. Évolutions prévues

| Évolution | Priorité | Technologie | Phase |
|---|---|---|---|
| Reconnaissance vocale par empreinte | Haute | Vosk Speaker ID | 9 |
| Mode intrus théâtral (lumières, sirène) | Haute | Home Assistant + Zigbee | 9 |
| Bot Telegram personnel (agenda, météo) | Haute | python-telegram-bot | 7 |
| **Liveness niveau 2 (sourire + blink)** | **Haute** | **MediaPipe** | **9** |
| Reconnaissance iris (coffre) | Moyenne | OpenCV + LED IR + servo | 10 |
| LLM local offline | Moyenne | Ollama + Phi-3 mini | 10 |
| SIEM maison | Moyenne | Wazuh ou ELK Stack | 11 |
| Honeypot réseau | Moyenne | Cowrie + Grafana | 11 |
| **Canal alerte secondaire (email SMTP)** | **Moyenne** | **smtplib Python** | **7** |
| Cluster Kubernetes | Basse | K3s sur Pi x3 | 12 |
| Station météo capteurs physiques | Basse | DHT22 + BME280 + Grafana | 10 |
| Tableau de bord mural | Basse | Écran HDMI + React fullscreen | 9 |

---

## 11. Valeur portfolio et compétences

### 11.1 Compétences couvertes

| Domaine | Compétences concrètes |
|---|---|
| Systèmes Linux | RPi OS Lite, CLI, systemd, cron, gestion services, logs |
| Réseau | IP statique, DHCP, pare-feu UFW, IPv6, **MQTT TLS**, WireGuard VPN |
| Développement Python | FastAPI, WebSocket, OpenCV, GPIO, MQTT, SQLAlchemy, **bcrypt, JWT** |
| Électronique / IoT | GPIO, ESP32, MicroPython, capteurs, **HX711**, deep sleep, batterie |
| Frontend | React 19, WebSocket client, CSS avancé, **Framer Motion, GSAP**, UX tablette |
| Cybersécurité | **bcrypt, JWT refresh, rate limiting, liveness anti-spoofing**, pare-feu, VPN, rôles |
| DevOps | Docker, Nginx, systemd, déploiement automatisé, monitoring, **watchdog heartbeat** |
| IA / Vision | **YuNet + SFace** (détection + reconnaissance), **MediaPipe liveness**, Piper TTS, Vosk ASR |

## 11.2

### 11.3 Documentation prévue

- README complet sur GitHub (antalyax21)
- Schéma d'architecture réseau
- Guide d'installation étape par étape
- Page projet sur zcode-digital-solutions.fr
- Article de blog technique sur les choix d'architecture et de sécurité

---

## 12. Règles de sécurité obligatoires

> Ces règles constituent le socle minimum non négociable. Chaque règle est préfixée par son domaine et numérotée. Statut : **✅ Implémenté** · **⚠️ Partiel** · **❌ À faire**.

---

### 12.1 Authentification (A)

| ID | Règle | Statut |
|---|---|---|
| A01 | PIN de 6 chiffres — jamais stocké en clair, haché bcrypt côté backend | ⚠️ SHA-256 frontend, bcrypt backend à faire |
| A02 | Phrase vocale — jamais stockée en clair, haché bcrypt | ❌ Backend Phase 5 |
| A03 | JWT access token : durée maximale 2h | ❌ Backend Phase 5 |
| A04 | Refresh token : durée 24h, stocké HttpOnly cookie | ❌ Backend Phase 5 |
| A05 | Révocation token en cas de lockdown ou changement de secret | ❌ Backend Phase 5 |
| A06 | Blocage après 3 tentatives PIN incorrectes (cooldown 30s) | ⚠️ Cooldown frontend présent, pas de compteur |
| A07 | Liveness check obligatoire avant accès zone bureau | ❌ Phase 4 (MediaPipe EAR) |
| A08 | Logs de chaque tentative d'authentification (succès + échec) | ❌ Backend Phase 5 |
| A09 | Pas de credentials dans les variables d'environnement Vite côté client en production | ⚠️ `.env.example` documenté, à surveiller |
| A10 | Changement du PIN obligatoire tous les 180 jours (alerte Telegram) | ❌ Backend Phase 5 |

---

### 12.2 Réseau (R)

| ID | Règle | Statut |
|---|---|---|
| R01 | Aucun port exposé directement sur Internet — accès externe via WireGuard uniquement | ✅ Architecture définie |
| R02 | MQTT sur port 8883 avec TLS (certificat auto-signé minimum) | ❌ Phase 3 |
| R03 | Interface web servie uniquement en HTTPS en production (Nginx + Let's Encrypt ou auto-signé) | ❌ Phase 8 |
| R04 | Pare-feu `ufw` sur le Pi : règles minimales (SSH, 8883, 443, WireGuard) | ❌ Phase 8 |
| R05 | SSH sur port non standard (ex. 2222), authentification par clé uniquement, PermitRootLogin no | ❌ Phase 1 |
| R06 | Fail2ban actif sur SSH et interface web | ❌ Phase 8 |
| R07 | Scan réseau périodique (nmap passif) — alerte si appareil inconnu | ❌ Phase 8 |
| R08 | Segmentation réseau recommandée : ESP32 sur VLAN IoT séparé | ❌ Évolution future |
| R09 | Nginx : headers de sécurité (HSTS, X-Frame-Options, X-Content-Type-Options, CSP) | ⚠️ CSP dans index.html, Nginx à configurer Phase 8 |
| R10 | Monitoring des connexions WireGuard (alerte si peer inconnu) | ❌ Phase 8 |

---

### 12.3 Application (AP)

| ID | Règle | Statut |
|---|---|---|
| AP01 | Content Security Policy — `script-src 'self'` en production (supprimer `unsafe-inline`) | ⚠️ Présent mais avec unsafe-inline (Vite impose) |
| AP02 | Pas de données sensibles dans le localStorage ou sessionStorage | ✅ Aucun usage actuel |
| AP03 | Sanitisation de toutes les entrées utilisateur côté backend (SQLAlchemy ORM, pas de SQL brut) | ❌ Backend Phase 5 |
| AP04 | Rate limiting sur tous les endpoints API (FastAPI + SlowAPI) | ❌ Backend Phase 5 |
| AP05 | Requêtes Telegram via le backend uniquement — jamais depuis le frontend | ❌ À corriger Phase 5 (actuellement dans utils/telegram.js) |
| AP06 | Logs applicatifs : jamais de données biométriques ou de hash en clair dans les fichiers de log | ❌ Backend Phase 5 |
| AP07 | Dépendances npm : audit mensuel (`npm audit`), pas de packages abandonnés | ⚠️ À mettre en routine |
| AP08 | Build de production : `npm run build`, jamais servir le mode dev en production | ❌ Phase 8 |
| AP09 | Variables `VITE_*` : aucune valeur secrète — les secrets restent backend uniquement | ✅ Documenté dans .env.example |
| AP10 | CORS : le backend FastAPI n'autorise que l'origine locale du Pi | ❌ Backend Phase 5 |

---

### 12.4 Données (D)

| ID | Règle | Statut |
|---|---|---|
| D01 | Base SQLite chiffrée avec SQLCipher ou accès fichier restreint (chmod 600, owner pi) | ❌ Phase 5 |
| D02 | Photos d'alerte : stockées localement uniquement, jamais dans un cloud tiers | ✅ Architecture définie |
| D03 | Intégrité des logs : hash SHA-256 chaîné (chaque ligne contient le hash de la précédente) | ❌ Phase 5 |
| D04 | Rétention des logs : 30 jours glissants (rotation automatique) | ❌ Phase 5 |
| D05 | Rétention des photos : 7 jours glissants (cron de nettoyage) | ❌ Phase 5 |
| D06 | Backup chiffré hebdomadaire de la BDD vers stockage externe (clé USB ou NAS) | ❌ Phase 8 |
| D07 | Données biométriques (encodages visages) stockées dans un fichier séparé, chmod 600 | ❌ Phase 4 |
| D08 | Pas de logs contenant l'image du visage — uniquement le nom reconnu ou "INCONNU" | ❌ Phase 4 |
| D09 | Token Telegram et autres secrets : stockés dans `.env` hors du repo Git (`.gitignore`) | ✅ `.gitignore` à vérifier |
| D10 | RGPD : affichage d'une mention d'information visible dans la zone entrée (tablette USER) | ❌ Phase 6 |

---

### 12.5 Physique (P)

| ID | Règle | Statut |
|---|---|---|
| P01 | Raspberry Pi dans un boîtier fermé, fixé physiquement (pas accessible sans outil) | ❌ Installation physique |
| P02 | Carte SD de qualité (Samsung Pro Endurance recommandée) ou SSD USB comme support principal | ❌ Installation physique |
| P03 | Alimentation sur onduleur (UPS) — au minimum un powerbank dédié | ❌ Installation physique |
| P04 | Port USB du Pi : désactiver les ports non utilisés (udev rules) | ❌ Phase 8 |
| P05 | Étiquette de localisation sur le Pi (zone, IP, dernier changement de mot de passe) | ❌ Installation physique |
| P06 | Tablettes fixées en mode kiosque (Fully Kiosk Browser, verrouillage matériel) | ❌ Phase 6 |

---

### 12.6 Opérationnel (O)

| ID | Règle | Statut |
|---|---|---|
| O01 | Systemd watchdog : redémarrage automatique de tous les services critiques | ❌ Phase 8 |
| O02 | Heartbeat Telegram toutes les heures — silence = alerte | ❌ Phase 7 |
| O03 | Mises à jour OS automatiques de sécurité uniquement (`unattended-upgrades`) | ❌ Phase 8 |
| O04 | Pas de mises à jour automatiques des paquets applicatifs — contrôle manuel | ✅ Décision d'architecture |
| O05 | Rotation des secrets (PIN, phrase vocale) documentée dans un processus écrit | ❌ À documenter |
| O06 | Test de restauration backup : mensuel | ❌ Phase 8 |
| O07 | Revue des logs d'accès : hebdomadaire | ❌ Opérationnel |
| O08 | Documentation à jour dans le repo Git (CHANGELOG.md à chaque modification) | ⚠️ CDC v2 en cours |
| O09 | Séparation des rôles : compte `pi` pour l'app, compte `admin` séparé pour la maintenance | ❌ Phase 1 |
| O10 | Pas de mot de passe par défaut — changer tous les mots de passe à l'installation (Pi, MQTT, WireGuard) | ❌ Phase 1 |

---

### 12.7 Checklist de déploiement

Avant toute mise en production, cocher chaque point :

```
[ ] SSH sur port non standard, clé uniquement
[ ] ufw configuré, règles minimales
[ ] Fail2ban actif
[ ] MQTT TLS 8883 fonctionnel, port 1883 bloqué
[ ] HTTPS activé (Nginx)
[ ] JWT 2h + refresh 24h opérationnel
[ ] Rate limiting sur /api/auth
[ ] .env hors du repo, secrets forts (>= 20 caractères)
[ ] npm audit clean (0 critical, 0 high)
[ ] Base SQLite : chmod 600
[ ] Backup chiffré configuré
[ ] Heartbeat Telegram testé
[ ] Toutes les règles A01–O10 à statut ✅
```

---

## 13. Phases de test

> Chaque scénario de test doit être documenté avec : date, résultat attendu, résultat obtenu, statut (PASS / FAIL). Les tests sont répartis en trois catégories : fonctionnels, sécurité, robustesse.

---

### 13.1 Tests fonctionnels

| ID | Scénario | Étapes | Résultat attendu |
|---|---|---|---|
| F01 | Déverrouillage PIN correct | Saisir le code à 6 chiffres correct sur la tablette USER | Accès accordé, dashboard visible, log créé |
| F02 | Déverrouillage PIN incorrect | Saisir 3 codes incorrects consécutifs | Accès refusé, cooldown 30s, log des tentatives |
| F03 | Reconnaissance faciale — visage connu | Se présenter devant la caméra, cligner des yeux | Message de bienvenue vocal (Piper TTS), log |
| F04 | Reconnaissance faciale — visage inconnu | Se présenter avec un visage non enregistré | Alerte Telegram avec photo, son d'alerte |
| F05 | Anti-spoofing — photo imprimée | Présenter une photo du visage autorisé | Liveness échoue, alerte, log de tentative de spoofing |
| F06 | Capteur PIR — détection de mouvement | Passer devant le capteur PIR | Alerte visible sur dashboard, notification si armé |
| F07 | Capteur magnétique — ouverture porte | Ouvrir la porte surveillée | Capteur passe à "OUVERT", log, alerte si armé |
| F08 | Boîte aux lettres — dépôt courrier | Déposer un objet de >50g dans la boîte | Notification Telegram "Courrier détecté" |
| F09 | Armement / désarmement | Appuyer sur le bouton ARMER depuis la tablette USER | Statut passe à ARMÉ, confirmé sur tablette ADMIN |
| F10 | Verrouillage automatique | Laisser l'interface inactive 5 minutes | Retour à l'écran PIN, session expirée |
| F11 | Bot Telegram — commande /statut | Envoyer /statut depuis Telegram | Réponse avec l'état actuel du système |
| F12 | Bot Telegram — commande /photo | Envoyer /photo depuis Telegram | Capture de la caméra envoyée en réponse |

---

### 13.2 Tests de sécurité

| ID | Scénario | Méthode | Résultat attendu |
|---|---|---|---|
| S01 | Bruteforce PIN | Script Python tentant 10 000 PINs via l'API | Blocage après 3 tentatives, IP bannie par fail2ban |
| S02 | Spoofing visage — photo | Présenter une photo imprimée A4 haute résolution | Liveness MediaPipe détecte l'absence de clignement → refus |
| S03 | Injection MQTT | Publier un message malformé sur `sentinel/zone/cmd` via mosquitto_pub | Message ignoré, log de tentative d'injection |
| S04 | Extraction bundle JS | Télécharger le bundle Vite produit, chercher les secrets | Aucun secret présent (PIN_HASH uniquement, jamais le PIN clair) |
| S05 | Bypass JWT | Forger un JWT avec algorithme "none" ou clé modifiée | API retourne 401 sur toutes les routes protégées |
| S06 | Scan de ports | `nmap -sV 192.168.1.X` depuis le réseau local | Seuls les ports autorisés visibles (443, WireGuard) |
| S07 | Injection SQL | Tentative d'injection dans les champs nom/zone via l'API | SQLAlchemy ORM retourne une erreur 422, pas de fuite de données |
| S08 | Replay attaque vocale | Rejouer un enregistrement audio de la phrase secrète | Vosk + analyse temporelle détecte le replay → refus |
| S09 | Accès physique à la carte SD | Extraire la SD, monter le système de fichiers sur un autre PC | Base SQLite chiffrée (SQLCipher), fichiers .env non lisibles |
| S10 | DoS API | Envoyer 1000 requêtes/seconde sur `/api/auth` | Rate limiting (SlowAPI) bloque après 10 req/s |

---

### 13.3 Tests de robustesse

| ID | Scénario | Méthode | Résultat attendu |
|---|---|---|---|
| R01 | Redémarrage Pi à froid | Couper l'alimentation sans arrêt propre | Tous les services redémarrent via systemd en < 60s |
| R02 | Perte de réseau WiFi | Couper le WiFi pendant 5 minutes | ESP32 reconnecte automatiquement, aucune donnée perdue |
| R03 | Perte connexion MQTT | Arrêter Mosquitto 5 minutes | Clients ESP32 reconnectent et re-publient le dernier état |
| R04 | Remplissage disque | Remplir la SD à 95% | Alertes déclenchées, rotation des logs activée, pas de crash |
| R05 | Température Pi élevée | Stresser le CPU (stress-ng) jusqu'à 80°C | Throttling activé, alerte Telegram, aucun arrêt brusque |
| R06 | Déconnexion tablette | Couper la WiFi de la tablette USER | Interface affiche "Connexion perdue", reconnecte automatiquement |
| R07 | Caméra débranchée | Débrancher la caméra Pi pendant le fonctionnement | Message d'erreur propre dans les logs, pas de crash du backend |
| R08 | ESP32 batterie faible | Batterie ESP32 sous 10% | Alerte Telegram "Batterie faible zone X", log créé |
| R09 | Heap OOM backend | Simuler une fuite mémoire (boucle sans fin) | Watchdog systemd redémarre le service en < 30s |
| R10 | Corruption base de données | Corrompre manuellement un enregistrement SQLite | Backup chargé automatiquement, alerte Telegram |

---

### 13.4 Fréquence des tests

| Catégorie | Fréquence | Responsable |
|---|---|---|
| Tests fonctionnels (F01–F12) | À chaque déploiement majeur | Lylia |
| Tests de sécurité (S01–S10) | Mensuel + après toute modification du backend | Lylia |
| Tests de robustesse (R01–R10) | Trimestriel | Lylia |
| Scan de vulnérabilités (`npm audit`, `pip audit`) | Hebdomadaire (automatisé) | CI/cron |
| Revue des logs d'accès | Hebdomadaire | Lylia |
| Test de restauration backup | Mensuel | Lylia |

---

### 13.5 Checklist de validation finale

Avant de considérer le projet comme "Production Ready" :

```
FONCTIONNEL
[ ] F01 PASS — PIN correct → accès accordé
[ ] F02 PASS — PIN incorrect × 3 → cooldown
[ ] F03 PASS — Visage connu → TTS + log
[ ] F04 PASS — Visage inconnu → Telegram + photo
[ ] F05 PASS — Anti-spoofing → photo refusée
[ ] F09 PASS — Armement depuis tablette USER + confirmation ADMIN
[ ] F11 PASS — Bot /statut répond correctement
[ ] F12 PASS — Bot /photo envoie une capture

SÉCURITÉ
[ ] S01 PASS — Bruteforce bloqué par fail2ban
[ ] S02 PASS — Photo imprimée refusée (liveness)
[ ] S04 PASS — Bundle JS sans secret
[ ] S05 PASS — JWT forgé → 401
[ ] S06 PASS — Ports exposés = minimum prévu

ROBUSTESSE
[ ] R01 PASS — Redémarrage à froid → services up en < 60s
[ ] R05 PASS — Alerte température activée
[ ] R08 PASS — Alerte batterie ESP32

OPÉRATIONNEL
[ ] Heartbeat Telegram actif
[ ] Backup chiffré testé et restauré avec succès
[ ] npm audit : 0 critical, 0 high
[ ] pip audit : 0 critical, 0 high
[ ] Toutes les règles section 12 à statut ✅
```

---

## Récapitulatif des changements v1.0 → v2.0

| Point | v1.0 | v2.0 |
|---|---|---|
| PIN longueur | 4 chiffres | **6 chiffres** |
| IP Raspberry Pi | 192.168.1.51 (fixe) | **À définir** (réservation MAC) |
| Météo | USER + ADMIN | **USER uniquement** |
| Armé/désarmé | USER uniquement | **USER + ADMIN** |
| Reconnaissance faciale | face_recognition (dlib) | **YuNet + SFace (OpenCV)** |
| Anti-spoofing | Absent | **Liveness MediaPipe (EAR blink)** |
| MQTT | Port 1883, non chiffré | **Port 8883, TLS** |
| JWT expiration | 24h | **2h + refresh token 24h** |
| Hachage secrets | bcrypt (non précisé côté code) | **bcrypt confirmé (passlib)** |
| Capteur boîte aux lettres | Poids ESP32 (vague) | **HX711 cellule de charge** |
| Watchdog | Absent | **Heartbeat Telegram toutes les heures** |
| Canal alerte secondaire | Absent | **Email SMTP en fallback** |
| Intégrité logs | Absent | **Hash SHA-256 chaîné** |
| CSS Frontend | Tailwind (spec initiale) | **CSS custom + Framer Motion + GSAP** |

---

---

## Glossaire technique

> Tous les termes techniques utilisés dans ce document, expliqués simplement. Classés par domaine.

---

### Matériel & Électronique

**Raspberry Pi 5** — Nano-ordinateur grand public (taille d'une carte de crédit) sous architecture ARM. Tourne sous Linux, consomme ~5W, suffisant pour faire tourner un backend Python, une base de données, un broker MQTT, et du traitement d'image en temps réel. C'est le cerveau central du système.

**ESP32** — Microcontrôleur WiFi/Bluetooth ultra-basse consommation (~3mA en deep sleep). Utilisé pour les capteurs terrain (portes, fenêtres, mouvement, boîte aux lettres). Ne tourne pas Linux — il exécute un firmware C++ minimaliste qui lit un capteur et publie sur MQTT.

**Deep sleep** — Mode veille extrême de l'ESP32 où quasiment toute l'électronique est coupée. Il se réveille toutes les N secondes pour lire le capteur, publier le résultat, puis se rendort. Permet de tenir des mois sur batterie.

**GPIO (General Purpose Input/Output)** — Broches physiques du Raspberry Pi permettant de brancher des composants électroniques (capteurs, LEDs, relais…). Contrôlées via le code Python.

**PIR (Passive Infrared)** — Capteur de mouvement qui détecte les variations de chaleur infrarouge dans son champ de vision. Ne fait pas de photo — il produit juste un signal ON/OFF quand un être vivant passe devant.

**Capteur magnétique** — Deux pièces : un aimant fixé sur la porte/fenêtre et un capteur fixé sur le cadre. Quand la porte s'ouvre, l'aimant s'éloigne → signal détecté. Simple, fiable, très basse consommation.

**HX711** — Circuit amplificateur/convertisseur conçu pour les cellules de charge. Permet à l'ESP32 de mesurer un poids en grammes. Utilisé pour détecter la présence de courrier dans la boîte aux lettres.

**Cellule de charge** — Capteur de force qui se déforme légèrement sous un poids. Cette déformation génère une variation de résistance électrique mesurée par le HX711.

**NoIR** — Caméra Pi sans filtre infrarouge. Permet de voir dans le noir avec un éclairage IR invisible à l'œil nu — idéal pour la surveillance nocturne.

**UPS (Uninterruptible Power Supply)** — Onduleur, batterie de secours qui prend le relais instantanément en cas de coupure secteur. Évite un arrêt brutal du Pi qui pourrait corrompre la carte SD.

---

### Réseau & Protocoles

**MQTT (Message Queuing Telemetry Transport)** — Protocole de messagerie léger, conçu pour les objets connectés. Fonctionne en publish/subscribe : un appareil publie un message sur un "topic" (ex. `sentinel/entree/porte`), et tous les abonnés à ce topic le reçoivent instantanément. Idéal pour les ESP32 qui ont peu de mémoire et peu de bande passante.

**Mosquitto** — Implémentation open-source du broker MQTT (le serveur central qui reçoit et redistribue les messages). Léger, tourne parfaitement sur Raspberry Pi.

**Broker** — Intermédiaire dans le modèle MQTT. Les capteurs ne se parlent pas directement — ils publient tous vers le broker, qui se charge de livrer les messages aux abonnés. Analogie : le broker est un tableau d'affichage, les ESP32 collent des post-its, le backend lit les post-its.

**Topic MQTT** — Chemin hiérarchique qui identifie un canal de communication. Ex. `sentinel/entree/porte` = système sentinel, zone entrée, capteur porte. Le backend peut s'abonner à `sentinel/#` pour recevoir tous les messages du système.

**TLS (Transport Layer Security)** — Protocole de chiffrement des communications réseau (le "S" dans HTTPS). Utilisé pour chiffrer le canal MQTT (port 8883 au lieu de 1883). Sans TLS, les messages MQTT circulent en clair sur le réseau local.

**WireGuard** — VPN moderne, minimaliste et très rapide. Permet d'accéder au Pi depuis l'extérieur de la maison via un tunnel chiffré, sans exposer aucun port directement sur Internet.

**WebSocket** — Protocole de communication bidirectionnel et persistant entre un navigateur et un serveur. Contrairement au HTTP classique (requête → réponse → connexion fermée), le WebSocket garde le canal ouvert — le serveur peut envoyer des données au frontend à tout moment sans attendre une demande. Utilisé ici pour les mises à jour en temps réel des capteurs et alertes.

**Nginx** — Serveur web et reverse proxy. Sert les fichiers statiques du frontend React, redirige les requêtes `/api/` vers le backend FastAPI, et gère le HTTPS en production.

**Reverse proxy** — Intermédiaire réseau placé devant un ou plusieurs services. Le client ne parle qu'à Nginx, qui redirige vers le bon service interne. Centralise le HTTPS, les headers de sécurité, et limite l'exposition des services.

**ufw (Uncomplicated Firewall)** — Interface simplifiée pour configurer le pare-feu Linux. Permet de définir des règles simples : "autoriser le port 443, bloquer tout le reste".

**Fail2ban** — Outil qui analyse les logs système en temps réel et bannit automatiquement les adresses IP qui font trop de tentatives infructueuses (SSH, auth web…). Protection contre les attaques bruteforce.

**nmap** — Outil de scan réseau. Permet de découvrir les appareils connectés sur un réseau et les ports ouverts sur chaque machine. Utilisé ici pour le monitoring passif du réseau local.

---

### Backend & Base de données

**FastAPI** — Framework Python moderne pour créer des APIs web. Très rapide (basé sur ASGI), génère automatiquement une documentation interactive (Swagger UI), et valide les données d'entrée automatiquement. Choisi pour sa performance sur ARM et sa simplicité.

**Uvicorn** — Serveur ASGI qui fait tourner FastAPI. Gère les connexions HTTP et WebSocket de façon asynchrone — plusieurs requêtes simultanées sans bloquer.

**SQLAlchemy** — ORM (Object-Relational Mapper) Python. Permet d'interagir avec la base de données en écrivant du Python plutôt que du SQL brut. Protection naturelle contre les injections SQL car les requêtes sont paramétrées automatiquement.

**SQLite** — Base de données relationnelle légère stockée dans un seul fichier. Pas besoin de serveur séparé. Parfaitement adaptée à Home Sentinel (volume faible, accès unique par le backend).

**SQLCipher** — Extension de SQLite qui chiffre le fichier de base de données. Sans SQLCipher, si quelqu'un vole la carte SD, il lit tous les logs directement. Avec SQLCipher, le fichier est illisible sans la clé.

**JWT (JSON Web Token)** — Token d'authentification signé numériquement. Après une connexion réussie, le backend génère un JWT que le frontend envoie à chaque requête API. Durée limitée à 2h pour réduire les risques en cas de vol.

**Refresh token** — Token de longue durée (24h) qui permet d'obtenir un nouveau JWT sans se réauthentifier. Stocké dans un cookie HttpOnly (inaccessible au JavaScript). Le JWT est court et léger, le refresh token est long et sécurisé.

**bcrypt** — Algorithme de hachage conçu spécifiquement pour les mots de passe. Volontairement lent et avec un "coût" configurable — rend les attaques bruteforce très coûteuses. Utilisé côté backend pour stocker le PIN et la phrase secrète.

**SHA-256** — Algorithme de hachage cryptographique rapide. Utilisé côté frontend pour éviter de stocker le PIN en clair dans le bundle JavaScript. Trop rapide pour être utilisé seul pour des mots de passe → c'est pour ça que bcrypt prend le relais côté backend.

**passlib** — Librairie Python qui simplifie l'utilisation de bcrypt (et d'autres algorithmes). Gère automatiquement le salt aléatoire et le versioning des hashes.

**Rate limiting** — Limitation du nombre de requêtes acceptées par unité de temps. Ex. : 5 tentatives de connexion maximum par minute par IP. Implémenté avec SlowAPI. Ralentit drastiquement les attaques bruteforce.

**Salt** — Valeur aléatoire unique ajoutée à un mot de passe avant de le hacher. Empêche les attaques par tables précalculées (rainbow tables). bcrypt intègre un salt automatiquement.

---

### IA & Vision par ordinateur

**OpenCV** — Librairie open-source de traitement d'image et de vision par ordinateur. Utilisée pour accéder à la caméra, détecter des visages, et faire tourner les modèles YuNet et SFace.

**YuNet** — Modèle de détection de visages intégré directement dans OpenCV depuis la version 4.5. Très léger et rapide sur ARM. Détecte la position et les points clés du visage (yeux, nez, bouche).

**SFace** — Modèle de reconnaissance faciale intégré dans OpenCV. Compare les caractéristiques extraites par YuNet à une base de référence pour identifier un visage connu. Retourne un score de similarité.

**face_recognition (dlib)** — Ancienne librairie Python de reconnaissance faciale. Très précise mais lente à compiler et lente à l'exécution sur ARM (~2s par frame). Remplacée dans ce projet par YuNet + SFace, 5 à 10x plus rapide.

**Liveness detection** — Technique pour distinguer une personne réelle d'une photo ou d'un masque présenté à la caméra. Basée ici sur la détection de clignement des yeux (MediaPipe + EAR). Si aucun clignement en 3 secondes → spoofing présumé → accès refusé.

**MediaPipe** — Framework de traitement multimédia développé par Google. Utilisé ici pour détecter 468 points landmarks du visage en temps réel, ce qui permet de calculer l'EAR pour la détection de liveness.

**EAR (Eye Aspect Ratio)** — Ratio calculé à partir des points clés des paupières. En position ouverte, l'EAR est élevé (~0.3). Lors d'un clignement, il chute brièvement sous ~0.2. Une photo ne cligne jamais → EAR toujours stable → spoofing détecté.

---

### Audio & TTS/ASR

**Piper** — Moteur TTS (Text-To-Speech) entièrement offline développé par Nabu Casa. Génère une voix synthétique en français à partir de texte, sans connexion Internet. Très léger, fonctionne bien sur Raspberry Pi.

**TTS (Text-To-Speech)** — Synthèse vocale : conversion de texte en parole. Utilisé pour les messages de bienvenue, alertes vocales, et retour sonore du système.

**Vosk** — Moteur ASR entièrement offline. Reconnaît la parole en temps réel sans envoyer l'audio vers un cloud. Modèles disponibles en français. Utilisé pour la reconnaissance de la phrase secrète dans la zone bureau.

**ASR (Automatic Speech Recognition)** — Reconnaissance automatique de la parole : conversion de parole en texte. Inverse du TTS.

---

### Frontend & Animations

**React** — Librairie JavaScript pour construire des interfaces utilisateur sous forme de composants réutilisables. Gère l'état de l'interface et ne met à jour que les parties du DOM qui changent réellement.

**Vite** — Outil de build et serveur de développement ultra-rapide pour les projets JavaScript modernes. Remplace webpack / Create React App.

**Framer Motion** — Librairie d'animations pour React. Anime les composants de façon déclarative (opacity, x, y, scale…), gère les transitions entre pages (AnimatePresence) et les animations de listes en cascade (stagger).

**GSAP (GreenSock Animation Platform)** — Librairie d'animations JavaScript haute performance. Utilisée pour les animations complexes qui dépassent CSS : pluie de code Matrix sur canvas, effet glitch, compteurs de statistiques animés.

**AnimatePresence** — Composant Framer Motion qui permet d'animer des éléments lors de leur suppression du DOM. React supprime immédiatement les éléments sans possibilité d'animation de sortie — AnimatePresence résout ce problème. Utilisé pour les transitions de pages et les listes filtrées.

**CSP (Content Security Policy)** — Header HTTP (ou balise meta) qui indique au navigateur quelles sources de contenu sont autorisées. Ex. : `script-src 'self'` interdit tout script externe — protection principale contre les attaques XSS.

**XSS (Cross-Site Scripting)** — Attaque qui injecte du JavaScript malveillant dans une page web pour voler des données ou détourner une session. Le CSP est la défense principale côté frontend.

---

### Alertes & Communication

**python-telegram-bot** — Librairie Python pour interagir avec l'API Telegram Bot. Permet d'envoyer des messages texte, des photos, et de réagir aux commandes utilisateur (/statut, /armer, /photo…).

**SMTP** — Protocole d'envoi d'email. Utilisé comme canal d'alerte secondaire si Telegram est indisponible.

**Heartbeat** — Signal périodique envoyé automatiquement pour confirmer que le système est en vie. Home Sentinel envoie un message Telegram toutes les heures. Si le message n'arrive pas → le Pi est mort ou déconnecté.

---

### Sécurité avancée & Évolutions

**OWASP Top 10** — Classement des 10 catégories de vulnérabilités web les plus critiques, publié par l'Open Web Application Security Project. Référence standard en sécurité applicative. Home Sentinel est audité contre cette liste.

**Bruteforce** — Attaque qui essaie toutes les combinaisons possibles pour trouver un mot de passe ou un PIN. Contrée par : rate limiting, cooldown après N échecs, fail2ban.

**Spoofing** — Usurpation d'identité. Dans le contexte de la reconnaissance faciale : présenter une photo ou un masque du visage d'une personne autorisée pour tromper le système. Contrée par la détection de liveness.

**Injection SQL** — Attaque qui insère du code SQL malveillant dans une entrée utilisateur. Ex. : `'; DROP TABLE users; --`. Contrée par SQLAlchemy ORM qui paramètre toutes les requêtes automatiquement.

**Replay attack** — Attaque qui rejoue un enregistrement audio ou une capture réseau valide pour tromper un système d'authentification. Ex. : enregistrer la phrase secrète vocale puis la rejouer.

**SIEM (Security Information and Event Management)** — Système qui centralise et corrèle les logs de sécurité de plusieurs sources pour détecter des incidents. Wazuh et ELK Stack sont des SIEM open-source envisagés comme évolution future de Home Sentinel.

**Honeypot** — Système leurre délibérément vulnérable, conçu pour attirer et observer les attaquants sans risque pour l'infrastructure réelle. Cowrie est un honeypot SSH/Telnet open-source envisagé pour le réseau Home Sentinel.

**K3s** — Distribution Kubernetes légère taillée pour ARM. Permet de faire tourner plusieurs services du Pi sous forme de conteneurs orchestrés. Envisagé comme évolution pour passer d'un Pi unique à un mini-cluster.

**RGPD (Règlement Général sur la Protection des Données)** — Réglementation européenne sur la protection des données personnelles. La reconnaissance faciale et l'audio sont des données biométriques soumises au RGPD. Une mention d'information doit être affichée dans la zone entrée.

---

*Document rédigé par Lylia · Z Code Digital Solutions · Évreux · Juin 2026*
*Remplace la version 1.0 du cahier des charges (Mai 2026)*
