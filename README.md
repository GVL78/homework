# HomeworkMaster (Flemish Homework Builder)

HomeworkMaster is an advanced, modern web application designed for parents in Flanders (Belgium) to build customized homework, exercise sheets, and answer guides for their children. It supports both **Primary School (Basisonderwijs)** and **Secondary / Middle School (Middelbaar)**, and aligns closely with the Flemish curriculum standards (Eindtermen).

---

## 🌟 Key Features

1. **Flemish Learning Goals & Textbooks**:
   - Built-in subjects include Mathematics (supporting methods like *Reken Maar!*), Dutch (spelling, grammar, reading comprehension), French, Latin (supporting methods like *Pegasus*), English, Sciences, and History.
   - Organized child-specific workspaces (e.g., `#Thomas - Latin (Pegasus 2)`) to keep chat logs, uploaded files, and worksheets isolated.
2. **AI & Local Generation**:
   - Works immediately out of the box (**Demo Mode**) with high-fidelity local templates.
   - Secure connection to Google's **Gemini AI** (using your own free API Key) for deep research, custom vocabulary exercises, reading comprehension passages, and adaptive difficulty levels.
3. **Mistakes & Remediation Log**:
   - Log specific mistakes your child made on school exams (e.g., "forgot to find the common denominator when adding fractions").
   - Generate custom remediation worksheets with 10 to 40 exercises focused precisely on fixing those weak points.
4. **Google Docs & Print Exporter**:
   - Click **Copy for Google Docs** to copy formatted rich text to your clipboard. Paste it (`Ctrl+V`) directly into Google Docs (`docs.new`) or Microsoft Word to get a beautifully spaced, printable worksheet.
   - Alternatively, download worksheets as standalone HTML files.

---

## 💻 How to Run Locally on Your Laptop

Since HomeworkMaster is built entirely using client-side web technologies (HTML5, CSS3, and JavaScript), it does not require any background servers, databases, or local installation:

1. Download or copy the project folder to your computer.
2. Double-click on **`index.html`** to open the application directly in any web browser (Chrome, Edge, Firefox, Safari).
3. (Optional) Go to the **Settings** view (the gear icon on the bottom-left navigation bar) and enter your Gemini API Key. You can get a free API Key from [Google AI Studio](https://aistudio.google.com/).

---

## 🚀 How to Host Online for Free via GitHub Pages

You can host HomeworkMaster online for free so you can access it from your phone, tablet, or any computer, and easily manage your children's learning workspaces on the go:

1. **Create a GitHub Account**: Sign up for free on [github.com](https://github.com/).
2. **Create a New Repository**:
   - Click the `+` icon in the top-right corner and select **New repository**.
   - Name it (e.g., `homeworkmaster`) and set the visibility to **Public**.
   - Click **Create repository**.
3. **Upload the Code Files**:
   - On the repository setup screen, click on the **uploading an existing file** link.
   - Drag and drop the following four files into the upload window:
     - `index.html`
     - `styles.css`
     - `app.js`
     - `favicon.svg`
   - Scroll down and click **Commit changes** to save them.
4. **Enable GitHub Pages**:
   - Click the **Settings** tab at the top of your repository page (the gear icon).
   - In the left sidebar, click on **Pages** (under the *Code and automation* section).
   - Under **Build and deployment**, ensure the Source is set to **Deploy from a branch**.
   - Under **Branch**, change **None** to **main** (or `master` depending on your repository branch name) and leave the folder set to `/ (root)`.
   - Click **Save**.
5. **Start Using the App**:
   - Wait about 1 minute, then refresh the Pages screen. You will see a message at the top containing your live URL (e.g., `https://yourusername.github.io/homeworkmaster/`).
   - Open that URL in any browser. Your API Key and child workspaces will be saved completely securely in your browser's local storage (`localStorage`). No data is ever shared or stored on GitHub.
