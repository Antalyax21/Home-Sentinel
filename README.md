---
icon: user-hoodie
---

# Home Sentinel

Système de sécurité résidentiel auto-hébergé sur Raspberry Pi 5.\
Projet double objectif : infrastructure de sécurité fonctionnelle + portfolio

***

## Aperçu

Home Sentinel est un tableau de bord de sécurité maison avec deux interfaces distinctes :

* **Interface ADMIN** — tableau de bord complet, accès PIN 6 chiffres, gestion caméras/capteurs/alertes/réseau
* **Interface USER** — tablette kiosque à l'entrée, désarmement/armement PIN 4 chiffres, météo, tâches du jour

L'état armé/désarmé est synchronisé en temps réel entre les deux interfaces via localStorage pour le moment (WebSocket FastAPI en phase backend).

***

## Stack technique

| Couche        | Technologie                                     |
| ------------- | ----------------------------------------------- |
| Frontend      | React 19 + Vite                                 |
| Animations    | Framer Motion + GSAP                            |
| Météo         | Open-Meteo API (gratuit, no CORS, no clé)       |
| Hachage       | bcryptjs (navigateur) → bcrypt Python (backend) |
| Persistence   | localStorage (→ SQLite + SQLAlchemy en backend) |
| Runtime cible | Raspberry Pi 5 4 Go, IP statique 192.168.1.51   |

***

## Fonctionnalités actuelles (frontend)

### Interface ADMIN (`/`)

* Verrou PIN 6 chiffres à l'ouverture
* Dashboard : stats temps réel, 3 mini-feeds caméra, état capteurs, alertes récentes
* Bouton LOCKDOWN / DÉSARMER dans le header
* Bannière rouge clignotante quand système armé

### Caméras (`/cameras`)

* 3 caméras : Salon (CAM-01), Entrée (CAM-02), Garage (CAM-03)
* CAM-02 s'active automatiquement à l'armement, s'éteint au désarmement
* L'admin peut toujours overrider manuellement
* Activation/désactivation individuelle avec confirmation

### Capteurs (`/sensors`)

* Liste des capteurs avec état ouvert/fermé
* Toggle individuel et tout activer/désactiver
* Compteurs animés (GSAP)

### Alertes (`/alerts`)

* Filtres par sévérité, marquer comme lu, supprimer
* Statistiques par catégorie

### Journaux (`/logs`)

* Logs d'accès avec filtres, pagination, export CSV
* Détection brute-force automatique

### Réseau (`/reseau`)

* Inventaire des appareils sur le réseau local

### Santé RPi (`/sante`)

* Surveillance CPU, RAM, température, stockage

### Liste noire (`/blacklist`)

* Gestion des IPs bloquées

### Paramètres (`/parametres`)

* Modification PIN USER (4 chiffres) et PIN ADMIN (6 chiffres)
* Délais configurables : entrée (défaut 60s), sortie (30s), dim auto (45s), verrou auto (60s)
* Démonstration bcrypt : hachage en navigateur, vérification, salt rounds configurables
* Tous les paramètres persistés en localStorage remplacer au back, lus par Verrou et tablette USER

### Tablette USER (`/user`)

* Horloge + météo temps réel (Open-Meteo, Évreux)
* Tâches du jour (localStorage, reset automatique chaque jour)
* Historique des 4 derniers accès (entrée / sortie / alarme)
* Flux désarmement : porte ouvre → PIN → désarmé → accès autorisé
* Flux armement : bouton Partir → PIN → vérification capteurs ouverts → compte à rebours 30s → armé
* Dim automatique après 45s d'inactivité
* Verrouillage automatique après 60s d'inactivité
* Synchronisation état armé avec le dashboard ADMIN

***

## Architecture cible (production)

```
Raspberry Pi 5
├── Mosquitto (MQTT broker)       ← ESP32 capteurs terrain
├── FastAPI + Uvicorn             ← API REST + WebSocket
│   ├── SQLite + SQLAlchemy
│   ├── JWT (2-4h)
│   └── bcrypt (stockage PIN/mdp)
├── Piper TTS                     ← annonces vocales offline
├── Vosk ASR                      ← phrase secrète zone bureau
├── OpenCV + face_recognition     ← caméra Pi NoIR
├── python-telegram-bot           ← alertes photo + commandes
├── WireGuard                     ← accès distant sécurisé
└── Nginx                         ← reverse proxy
```

***

## Matériel

| Composant            | Détail                                            |
| -------------------- | ------------------------------------------------- |
| Raspberry Pi 5 4 Go  | IP statique 192.168.1.51                          |
| ESP32 × 5            | Capteurs terrain, MQTT, deep sleep                |
| Caméra Pi NoIR       | Entrée principale, IR nuit                        |
| Tablette Android × 2 | Fully Kiosk Browser, mode kiosque                 |
| HP USB avec micro    | TTS Piper + ASR Vosk                              |
| Box Livebox Max      | Aucun port ouvert, accès via WireGuard uniquement |

***

## Zones de sécurité

| Zone           | Authentification               | Comportement                                   |
| -------------- | ------------------------------ | ---------------------------------------------- |
| Entrée         | PIN 4 chiffres (tablette USER) | Compte à rebours 60s, sirène si timeout        |
| Bureau/Chambre | Phrase secrète vocale (Vosk)   | Accès autorisé / refusé vocal, photo si intrus |

***

## Installation et lancement

```bash
git clone <repo>
cd Home-Sentinel
npm install
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173)

* Interface ADMIN : `http://localhost:5173/` —> PIN par défaut `123456`
* Tablette USER : `http://localhost:5173/user` —> PIN par défaut `1234`

***

## Roadmap

* [x] Frontend React — interfaces ADMIN et USER
* [x] Synchronisation état armé (localStorage → WebSocket)
* [x] Paramètres configurables + démonstration bcrypt
* [ ] Raspberry Pi OS Lite — SSH, GPIO, IP statique
* [ ] ESP32 + MQTT — capteurs terrain
* [ ] Backend FastAPI — WebSocket, JWT, SQLite
* [ ] Caméra + IA — stream RTSP, face\_recognition, Piper TTS
* [ ] Bot Telegram — `/statut` `/armer` `/desarmer` `/photo`
* [ ] Production — systemd, Nginx, WireGuard, tests

***

## Sécurité (portfolio)

Ce projet illustre les concepts suivants :

* **Authentification** : PIN haché bcrypt (cost factor configurable), JWT côté API
* **Chiffrement** : WireGuard pour l'accès distant, aucun port exposé directement
* **Segmentation réseau** : VLAN ESP32 isolé, broker MQTT local uniquement
* **Journalisation** : logs d'accès avec détection brute-force
* **Alertes** : Telegram bot avec photo de l'intrus
* **Hardening** : Raspberry Pi OS Lite, fail2ban, accès SSH par clé uniquement

***

\*Projet personnel - Lylix
