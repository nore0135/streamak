# Kairo — public media & study library

Kairo is a static, responsive website for a public catalogue of **authorised** anime, serials, films, and study material. It is designed to deploy on GitHub Pages and to open approved Google Drive files in a new tab.

## What is included

- Separate Home, Explore, Watch, Learn, About, and title-detail views.
- Search and shelf filters for anime, serials, and study items.
- A device-local “Save for later” queue using `localStorage`.
- Responsive layouts for phone, tablet, and desktop.
- No framework, build step, database, or secret required.
- A GitHub Pages Actions workflow at `.github/workflows/deploy-pages.yml`.

## Add your Google Drive library

1. Create a dedicated Google Drive folder for files you are allowed to share.
2. Set sharing intentionally. **Anyone with the link can access a public file**, so do not use this for private or confidential material.
3. Open `content.js` and set the folder URL:

   ```js
   window.SITE_CONFIG = {
     driveFolderUrl: "https://drive.google.com/drive/folders/YOUR_PUBLIC_FOLDER_ID",
     driveFolderLabel: "Open public library",
     contactEmail: "hello@example.com",
     rightsNote: "Only publish content you own, have permission to share, or that is in the public domain."
   };
   ```

4. Give each catalogue entry its own approved source URL by replacing its empty `sourceUrl` value in `content.js`:

   ```js
   sourceUrl: "https://drive.google.com/file/d/YOUR_FILE_ID/view"
   ```

The site does not use a Google Drive API and does not store a Drive token. A static GitHub Pages site cannot safely read private Drive files or keep service-account credentials. If private access is needed, add a real authenticated backend rather than putting credentials in browser JavaScript.

## Replace the demo catalogue

`content.js` contains original placeholder titles so the interface works immediately. Replace them with your own metadata and links. The site intentionally does not include unauthorised copyrighted movies or episodes.

For each entry, update fields such as:

- `title`
- `type` (`anime`, `serial`, or `study`)
- `label`, `year`, `duration`, and `rating`
- `description`, `blurb`, and `tags`
- `tone` (`violet`, `cyan`, `peach`, `amber`, `lime`, `blue`, `mint`, `rose`, `slate`, or `indigo`)
- `sourceUrl`

## Publish with GitHub Pages

This folder is intentionally isolated from the other files in the workspace. Create a GitHub repository from **this `anime-hub` folder only**.

### Option A: GitHub Actions (recommended)

```powershell
git init
git add .
git commit -m "feat: add public media library"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Then open the repository on GitHub:

1. Go to **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions**.
3. Wait for the `Deploy static site to GitHub Pages` workflow to finish.
4. Visit the Pages URL shown by GitHub.

The included workflow deploys the repository root, so `index.html`, `styles.css`, `content.js`, and `app.js` must stay at the repository root.

### Option B: manual Pages deployment

If you do not want Actions, choose **Deploy from a branch**, select `main`, and choose the repository root. The site is already a no-build static site.

## Local preview

From this folder, run one of the following:

```powershell
python -m http.server 4173
```

Then open <http://localhost:4173>.

## Rights and privacy note

Only publish content you own, have permission to share, or that is in the public domain. Do not publish private Drive files, personal data, or copyrighted anime/serials without permission. GitHub Pages and public Drive links are accessible to anyone who finds the URL and may be indexed or copied.
