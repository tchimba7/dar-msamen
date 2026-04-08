# Dar Msamen - Plateforme Nourriture Traditionnelle

Base V1 d'une plateforme multi-roles pour produits traditionnels marocains (msamen, harcha, malwi, batbot), construite avec Next.js App Router.

## Stack

- Next.js 16 + TypeScript
- PostgreSQL + Drizzle ORM
- NextAuth (credentials email/mot de passe)
- Tailwind CSS + composants style shadcn

## Roles

- `SUPER_ADMIN`: controle global (analytics, utilisateurs admin, categories, produits, clients, commandes)
- `ADMIN_USER`: gestion de ses produits, commandes, compte
- `CLIENT`: navigation produits, compte client, commandes COD
- `VISITEUR`: consultation publique du catalogue sans inscription

## Internationalisation

- Routes localisees: `/fr/*` et `/ar/*`
- Direction RTL active pour l'arabe

## Demarrage local

1. Copier l'environnement:

```bash
cp .env.example .env.local
```

2. Configurer PostgreSQL dans `DATABASE_URL`.

3. Generer et appliquer les migrations:

```bash
npm run db:generate
npm run db:migrate
```

4. Creer ou mettre a jour le super admin:

```bash
npm run db:seed
```

5. Lancer le projet:

```bash
npm run dev
```

## Routes principales

- `/fr` ou `/ar`: accueil public
- `/fr/produits`: catalogue public
- `/fr/connexion`: connexion
- `/fr/inscription`: inscription client
- `/fr/client`: espace client (role `CLIENT`)
- `/fr/admin`: espace utilisateur admin (role `ADMIN_USER`)
- `/fr/super-admin`: espace super admin (role `SUPER_ADMIN`)

## Notes

- En Next.js 16, la convention `middleware.ts` est remplacee par `proxy.ts`.
- Le paiement en ligne est reserve pour V2. V1 cible le flux `COD`.
- Pour l'hebergement serverless (ex: Vercel), configurez Supabase Storage via `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` pour les images produits.

## Pre-hebergement

- Configurez une vraie base PostgreSQL distante et mettez a jour `DATABASE_URL`.
- Definissez un `NEXTAUTH_SECRET` fort et unique par environnement.
- Renseignez `NEXTAUTH_URL` avec l'URL publique finale du site.
- Activez un vrai stockage image distant avant production. Le fallback local n'est pas adapte a un hebergement serverless.
- Activez `PHONE_VERIFICATION_PROVIDER=twilio` uniquement avec des identifiants de production valides.
- Activez `ORDER_CONFIRMATION_PROVIDER=twilio` si vous voulez envoyer les confirmations COD via WhatsApp apres commande.
- Choisissez explicitement le comportement de traduction produit via `PRODUCT_TRANSLATION_PROVIDER`.
- Verifiez `GET /api/health` apres deploiement pour confirmer la connectivite DB.
- Les metadonnees, `robots.txt`, `sitemap.xml` et `manifest.webmanifest` sont maintenant generes par l'application.
