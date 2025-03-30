# College Admissions Advisor

A comprehensive AI-powered college admissions guidance platform that leverages advanced machine learning to provide personalized insights for student application strategies.

## Features

- **Academic Profile Analysis**: Evaluate your GPA, SAT/ACT scores, and course rigor
- **Extracurricular Activities Assessment**: Get feedback on your activities and leadership roles
- **College Match**: Receive personalized admissions chances for your selected colleges
- **Improvement Plan**: Get tailored recommendations to strengthen your application
- **User Accounts**: Save your assessments and track your progress with Supabase authentication

## Tech Stack

- **Frontend**: React.js with TypeScript
- **UI/Components**: Shadcn UI, Tailwind CSS
- **Backend**: Node.js with Express
- **Authentication**: Supabase Auth
- **AI Integration**: DeepSeek AI API for advanced analysis
- **Type Safety**: Zod for validation, TypeScript for type checking

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/college-admissions-advisor.git
cd college-admissions-advisor
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file in the root directory and add your API keys:
```
DEEPSEEK_API_KEY=your_deepseek_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```
npm run dev
```

5. Open your browser and navigate to `http://localhost:5000`

## How It Works

1. Enter your academic information, including GPA, test scores, and courses
2. Add your extracurricular activities with descriptions and time commitments
3. List any honors or awards you've received
4. Select colleges you're interested in and your intended major
5. Receive a comprehensive assessment with detailed recommendations
6. Create an account to save your results and track your progress

## License

This project is licensed under the MIT License - see the LICENSE file for details.