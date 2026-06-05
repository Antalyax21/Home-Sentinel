# AUDIT DE SÉCURITÉ — HOME SENTINEL

| Champ         | Valeur                        |
|---------------|-------------------------------|
| Version       | 1.0                           |
| Date          | 2026-06-05                    |
| Classification| CONFIDENTIEL — usage personnel|
| Méthodologie  | Red Team + Blue Team + RSSI   |

---

## 1. RÉSUMÉ EXÉCUTIF

Home Sentinel est un tableau de bord de surveillance domotique développé en React/Vite.
À ce stade du projet (front-end uniquement, pas de backend), plusieurs vulnérabilités critiques
ont été identifiées. La plupart sont inhérentes à l'architecture actuelle et seront résolues
lors de l'intégration du backend FastAPI.

**Bilan rapide :**
- 2 vulnérabilités **CRITIQUES** (exposition de secrets dans le bundle JS)
- 3 vulnérabilités **ÉLEVÉES** (bypass d'authentification, absence de 2FA)
- 4 vulnérabilités **MOYENNES** (CSP, intégrité des logs, watchdog, canaux de secours)
- 3 points de **gouvernance / RGPD** à adresser

---

## 2. ARCHITECTURE ACTUELLE

```
[Navigateur]
    │
    ├── React + Vite (SPA, rendu côté client)
    ├── Framer Motion / GSAP (animations)
    ├── React Router DOM (navigation)
    │
    ├── Verrou PIN (6 chiffres, localStorage)
    ├── Timeout session (5 min inactivité)
    ├── Lockdown manuel
    │
    ├── Telegram Bot API ← appelé DIRECTEMENT depuis le navigateur
    └── Données mock (FastAPI prévu)
```

**Surface d'attaque actuelle :**
- Le bundle JS est téléchargeable publiquement
- Les variables d'environnement `VITE_*` sont compilées dans le bundle
- Toute la logique d'authentification s'exécute côté client

---

## 3. VULNÉRABILITÉS IDENTIFIÉES

### 3.1 — CRITIQUE · PIN en clair dans le bundle JS

**Composant :** `Verrou.jsx` + variable `VITE_CODE_PIN`

**Description :**
Les variables `VITE_*` de Vite sont injectées dans le bundle JavaScript à la compilation.
`VITE_CODE_PIN=123456` devient littéralement lisible dans `dist/assets/index-xxx.js`.

**Exploitation (Red Team) :**
```bash
# télécharger le bundle et chercher le PIN en 2 secondes
curl https://votre-dashboard.local/assets/index-xxx.js | grep -o 'CODE_PIN[^,]*'
```

**Impact :** Contournement total de l'écran de verrouillage.

**Correctif front-only (implémenté) :**
Stocker le hash SHA-256 du PIN dans `VITE_CODE_PIN_HASH`. Le plaintext n'est plus dans le bundle.
La comparaison se fait via Web Crypto API (`crypto.subtle.digest`).

**Correctif définitif (backend) :**
`POST /api/auth/pin` → FastAPI valide le PIN côté serveur → émet un JWT `httpOnly`.
Le PIN ne transite jamais vers le client.

**Résidu de risque après fix front-only :**
Un hash de 6 chiffres (10^6 combinaisons) reste bruteforçable hors-ligne en quelques secondes.
Le fix front-only réduit l'exposition sans éliminer le risque. Seul le backend élimine le risque.

---

### 3.2 — CRITIQUE · Token Telegram exposé dans le bundle

**Composant :** `utils/telegram.js` + variables `VITE_TELEGRAM_TOKEN`, `VITE_TELEGRAM_CHAT_ID`

**Description :**
Le token du bot Telegram et le chat ID sont compilés dans le bundle et envoyés directement
depuis le navigateur vers `https://api.telegram.org`.

**Exploitation (Red Team) :**
```javascript
// récupérable en 10 secondes via les DevTools → Sources → index-xxx.js
// une fois le token extrait :
fetch(`https://api.telegram.org/botTOKEN/sendMessage`, {
  method: 'POST',
  body: JSON.stringify({ chat_id: CHAT_ID, text: "Fausse alerte critique — LOCKDOWN" })
})
```

**Impact :**
- Envoi de fausses alertes (alert fatigue → l'opérateur ignore les vraies alertes)
- Suppression de vraies alertes via `deleteMessage`
- Enumération du compte Telegram

**Correctif définitif (backend uniquement) :**
Toutes les notifications passent par `POST /api/notif`. Le frontend n'appelle jamais Telegram.

**Pas de correctif front-only satisfaisant.** L'obfuscation du token est inefficace contre
un attaquant motivé. Minimiser l'impact : créer un bot dédié avec permissions minimales,
révoquer et regénérer le token régulièrement.

---

### 3.3 — ÉLEVÉE · Lockout PIN bypassable via localStorage

**Composant :** `Verrou.jsx` + `localStorage`

**Description :**
Le compteur de tentatives et le timestamp de blocage sont stockés dans `localStorage`,
accessible et modifiable sans restriction depuis les DevTools du navigateur.

**Exploitation (Red Team) :**
```javascript
// Console DevTools → 2 secondes
localStorage.removeItem("hs_tentatives")
localStorage.removeItem("hs_blocage_debut")
// résultat : tentatives illimitées, lockout annulé
```

**Impact :** Bruteforce du PIN sans aucune contrainte.

**Correctif front-only partiel :**
Doubler avec `sessionStorage` (lié à l'onglet, non partagé entre tabs) pour ajouter une couche.
Ne résout pas le problème fondamental.

**Correctif définitif (backend) :**
Compteur côté serveur, lié à l'IP source + un fingerprint. Inaccessible depuis le client.

---

### 3.4 — ÉLEVÉE · Absence de second facteur (2FA)

**Description :**
Un PIN à 6 chiffres représente 1 000 000 de combinaisons. En l'absence de rate-limiting
côté serveur, ce facteur unique peut être bruteforçé ou deviné (dates, codes simples).

**Correctif recommandé :**
TOTP (RFC 6238) — compatible Google Authenticator, Authy, Bitwarden.
- Backend : bibliothèque Python `pyotp`
- Frontend : saisie d'un code 6 chiffres rotatif toutes les 30 secondes, après le PIN
- Le secret TOTP est stocké exclusivement côté serveur

---

### 3.5 — ÉLEVÉE · Absence de session cryptographique

**Description :**
Après validation du PIN, l'état d'authentification est un simple booléen React en mémoire.
Il n'existe pas de token signé. N'importe quelle manipulation du state React
(via extension navigateur, ou bug dans le code) peut bypasser l'auth.

**Correctif (backend) :**
JWT signé (HS256, clé secrète serveur), stocké en `httpOnly; Secure; SameSite=Strict` cookie.
Durée de validité courte (1h). Refresh token pour les sessions longues.

---

### 3.6 — MOYENNE · Absence de Content Security Policy robuste

**Implémenté (fix front-only) :** Meta tag CSP dans `index.html`

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           script-src 'self' 'unsafe-inline';
           connect-src 'self' https://api.telegram.org;
           frame-ancestors 'none';" />
```

**Limitation :** `unsafe-inline` est requis par React/Vite. Une XSS via inline script reste possible.
**Correctif définitif :** Header HTTP servi par nginx, avec nonce par requête (élimine `unsafe-inline`).

---

### 3.7 — MOYENNE · Absence de watchdog / dead man's switch

**Description :**
Si le Raspberry Pi est mis hors tension, si le réseau est coupé, ou si le processus de
surveillance plante, aucune alerte n'est émise. L'opérateur est aveugle sans le savoir.

**Correctif :**
Le RPi envoie un heartbeat Telegram toutes les heures :
```
HOME SENTINEL · ALIVE · 2026-06-05 14:00:01 · CPU 34% · RAM 61%
```
Si le heartbeat est absent pendant 2 heures → alerte automatique depuis un second système
(cron job externe, service cloud, second RPi).

---

### 3.8 — MOYENNE · Intégrité des logs non garantie

**Description :**
Les logs ne disposent d'aucun mécanisme d'intégrité. Un attaquant ayant accès au système
peut modifier ou effacer les entrées sans laisser de trace. Les logs ne sont pas exploitables
comme preuves légales dans cet état.

**Correctif — hash chaîné (style Merkle simplifié) :**
```python
# FastAPI — à chaque insertion de log
import hashlib
hash_precedent = get_last_log_hash()
hash_nouveau = hashlib.sha256(
    f"{contenu_log}{hash_precedent}".encode()
).hexdigest()
insert_log(contenu=contenu_log, hash=hash_nouveau)
```
Toute modification d'un log casse la chaîne. Vérification possible en un seul parcours.

---

### 3.9 — MOYENNE · Canal de notification unique (Telegram)

**Description :**
Si Telegram est inaccessible (panne, blocage réseau, bot supprimé), toutes les alertes
sont silencieuses. Aucun mécanisme de fallback.

**Correctifs par priorité :**
1. **Email SMTP** (Python `smtplib`) — indépendant de Telegram
2. **Ntfy.sh** ou **Pushover** — push notifications alternatives
3. **SMS** via Twilio en dernier recours pour les alertes critiques

---

## 4. MESURES IMPLÉMENTÉES (FRONT-ONLY)

| Fix | Composant | Impact réel |
|-----|-----------|-------------|
| SHA-256 du PIN dans `.env` | `Verrou.jsx` + `Web Crypto API` | PIN plaintext absent du bundle |
| CSP meta tag | `index.html` | Réduit la surface XSS |
| X-Frame-Options DENY | `index.html` | Bloque le clickjacking |
| X-Content-Type-Options nosniff | `index.html` | Bloque le MIME sniffing |
| Verrouillage si onglet caché > 2 min | `App.jsx` | Limite l'exposition sur poste partagé |

---

## 5. ASPECTS RGPD / CONFORMITÉ

### 5.1 — Les adresses IP sont des données personnelles

Sous le RGPD (Art. 4), une adresse IP est une donnée à caractère personnel si elle permet
d'identifier une personne physique. Les logs de Home Sentinel contiennent des IPs avec
horodatage précis, catégorie d'accès et statut.

**Obligations :**

| Obligation | Statut | Action requise |
|-----------|--------|----------------|
| Durée de conservation définie | ✅ 3 mois implémenté | Documenter la justification |
| Registre des traitements | ❌ | Créer le registre (Art. 30) |
| Minimisation des données | ⚠️ Partiel | Ne logger que le nécessaire |
| Droit à l'effacement | ❌ | Prévoir la suppression d'une IP spécifique |
| Information des personnes surveillées | ❌ | Affichage si réseau partagé |

### 5.2 — Surveillance de personnes (famille, invités)

Si des membres de la famille ou des locataires sont présents dans le périmètre surveillé,
le RGPD exige une information préalable et, selon le cas, un consentement.

### 5.3 — Caméras IP

Les enregistrements vidéo sont soumis à des règles spécifiques en France (CNIL).
Tout système de vidéosurveillance dans un lieu non public (domicile partagé) doit
être déclaré et les personnes concernées informées.

---

## 6. MODÈLE DE MENACE (THREAT MODEL)

### Acteurs de menace identifiés

| Acteur | Motivation | Niveau technique | Probabilité |
|--------|-----------|------------------|-------------|
| Opportuniste (scan automatisé) | Accès réseau, botnet | Faible | Élevée |
| Intrus physique | Vol, intrusion | Faible à moyen | Moyenne |
| Attaquant distant ciblé | Espionnage, sabotage | Élevé | Faible |
| Insider (proche malveillant) | Accès données, sabotage | Variable | Faible |

### Scénarios d'attaque prioritaires

**Scénario 1 — Extraction du token Telegram**
```
Attaquant → télécharge le bundle JS public
         → grep TELEGRAM_TOKEN
         → envoie fausses alertes pendant 48h (alert fatigue)
         → opérateur ignore les vraies alertes
         → intrusion physique non détectée
```

**Scénario 2 — Bypass du PIN par localStorage**
```
Attaquant a accès physique au poste de travail
→ ouvre DevTools en mode privé
→ supprime hs_tentatives
→ bruteforce le PIN (dates, 123456, etc.)
→ accès complet au dashboard
```

**Scénario 3 — Suppression de traces**
```
Intrusion réussie → attaquant accède au dashboard
→ supprime les logs via l'interface (bouton "Tout effacer")
→ pas de logs serveur, pas de hash d'intégrité
→ aucune preuve exploitable
```

---

## 7. ARCHITECTURE CIBLE RECOMMANDÉE

```
[Navigateur]
    │ HTTPS uniquement
    │ JWT httpOnly cookie
    ▼
[Nginx]
    ├── Headers sécurité (CSP, HSTS, X-Frame-Options)
    ├── Rate limiting (10 req/min sur /api/auth)
    └── TLS 1.3 uniquement
    │
    ▼
[FastAPI]
    ├── POST /api/auth/pin     ← validation PIN + TOTP, émission JWT
    ├── GET  /api/logs         ← logs avec hash d'intégrité
    ├── GET  /api/alerts       ← SSE temps réel
    ├── POST /api/notif        ← proxy Telegram (token jamais exposé)
    ├── GET  /api/reseau       ← nmap / arp-scan
    └── GET  /api/sante        ← métriques RPi
    │
    ▼
[PostgreSQL / SQLite]
    ├── table logs (id, contenu, hash_chaine, horodatage)
    ├── table alertes
    └── table blacklist
```

---

## 8. ROADMAP DE SÉCURISATION

### Court terme — sans backend (réalisable maintenant)

| Priorité | Tâche | Effort | Implémenté |
|----------|-------|--------|------------|
| P0 | PIN stocké en SHA-256 dans .env | 30 min | ✅ |
| P0 | CSP + X-Frame-Options dans index.html | 15 min | ✅ |
| P1 | Verrouillage si onglet caché > 2 min | 20 min | ✅ |
| P1 | `npm audit` + mise à jour des dépendances | 30 min | ❌ |
| P2 | `.env` dans `.gitignore` vérifié | 5 min | ✅ |

### Moyen terme — avec backend FastAPI

| Priorité | Tâche | Effort estimé |
|----------|-------|---------------|
| P0 | Validation PIN côté serveur + JWT | 2h |
| P0 | Token Telegram côté serveur uniquement | 1h |
| P0 | Rate limiting sur l'endpoint d'auth | 30 min |
| P1 | TOTP 2FA (pyotp) | 3h |
| P1 | Hash d'intégrité sur les logs | 2h |
| P1 | Watchdog / heartbeat Telegram | 1h |
| P2 | Canal de notification secondaire (email) | 1h |
| P2 | Corrélation temporelle des événements | 4h |
| P2 | Détection d'anomalie sur les horaires | 3h |
| P3 | HTTPS / TLS avec Let's Encrypt | 1h |
| P3 | Alertes géographiques (IP hors France) | 2h |

### Long terme — durcissement avancé

| Tâche | Détail |
|-------|--------|
| Honeypot interne | Fausse page admin sur `/admin-panel` → alerte immédiate si visitée |
| Canary token | Faux fichier SSH key dans les logs → alerte si téléchargé |
| Segmentation réseau | VLAN dédié pour les caméras / IoT, isolé du réseau principal |
| Audit de dépendances en CI | `npm audit` + `safety` (Python) à chaque merge |
| Chiffrement des logs au repos | SQLCipher ou PostgreSQL avec TDE |

---

## 9. COMMANDES UTILES

```bash
# générer le hash SHA-256 du PIN (Windows)
node -e "const c=require('crypto');console.log(c.createHash('sha256').update('VOTRE_PIN').digest('hex'))"

# auditer les dépendances npm
npm audit

# vérifier que .env n'est pas commité
git log --all --full-history -- .env

# vérifier les secrets dans l'historique git
git grep VITE_TELEGRAM_TOKEN $(git rev-list --all)
```

---

## 10. CONCLUSION

Home Sentinel est un projet solide avec une bonne base architecturale.
Les vulnérabilités critiques identifiées sont quasi toutes liées à l'absence de backend,
et seront naturellement résolues lors de l'intégration de FastAPI.

**En l'état actuel (front-only) :** utilisation sur réseau local privé uniquement.
Ne pas exposer le dashboard sur internet sans avoir implémenté au minimum :
- Validation PIN côté serveur
- HTTPS
- Authentification par token signé

**Points positifs existants :**
- Timeout de session automatique (5 min)
- Lockdown manuel avec alerte Telegram
- Historique des accès PIN dans localStorage
- Rotation du lockout après 3 tentatives
- Corrélation alerte ↔ logs par IP
- Politique de rétention 3 mois avec export CSV obligatoire

---

*Document généré le 2026-06-05 — à mettre à jour à chaque évolution de l'architecture.*
