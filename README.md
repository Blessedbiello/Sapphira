# Sapphira: Scientific Hypothesis Generator

Saphira is a web application that generates scientific hypotheses based on biological literature and visualizes their support vs. complexity using a percolation plot. It uses a backend powered by Express and SQLite, with a Next.js frontend for user interaction.

## Project Structure



## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd saphira

   cd backend
npm install
npm run build
npm run start

cd frontend
npm install
npm run dev

## Data Preparation:
Ensure data/abstracts.json contains valid scientific abstracts.

The backend automatically loads and processes this data on startup.

Access the Application:
Open http://localhost:3000 to view the frontend.

The backend runs on http://localhost:3001.

# Features
Hypothesis Generation: Generates hypotheses at complexity levels 2-5 based on literature.

-   Percolation Plot: Visualizes support rate vs. complexity using Plotly.

-   Complexity Slider: Allows users to select desired hypothesis      complexity.

-   Literature Processing: Extracts entities and relations from abstracts using NLP.

## Future Improvements
Integrate Solana blockchain for decentralized hypothesis storage.

Enhance NLP with advanced models for better entity and relation extraction.

Add user authentication and hypothesis saving functionality.

