
# Telecom Customer Churn Prediction Platform

A full-stack machine learning platform that predicts telecom customer churn and provides insights through an interactive dashboard.

The project demonstrates an **end-to-end ML engineering workflow**, including data preprocessing, model training, API deployment, and frontend integration.

---

# Features

* Predict customer churn using trained ML models
* Return churn probability scores
* Compare baseline models (Logistic Regression, Random Forest)
* API-based prediction service
* Interactive dashboard for visualization

---

# Tech Stack

**Machine Learning**

* Python
* Pandas
* Scikit-learn
* NumPy

**Backend**

* Node.js
* Express

**Frontend**

* React

**Tools**

* Git & GitHub
* Jupyter Notebooks
* Kaggle dataset

---

# Project Structure

```
telecom-churn-platform/
│
├── ml-service/        # Python ML prediction service
├── backend/           # Node.js API server
├── frontend/          # React dashboard
├── notebooks/         # EDA and experimentation
├── data/              # Dataset files
└── README.md
```

---

# Machine Learning Models

Two baseline models were implemented and evaluated:

* Logistic Regression
* Random Forest

The best performing model is used for the prediction service.

Evaluation metrics include:

* Accuracy
* Precision
* Recall
* F1 Score
* ROC-AUC

---

# Dataset

The project uses a **public telecom churn dataset from Kaggle** containing features such as:

* demographics
* contract type
* tenure
* service subscriptions
* billing information

These features are used to train a **binary classification model** predicting customer churn.

---

# Setup

### Clone repository

```
git clone https://github.com/Rehobotw/telecom-churn-prediction-platform.git
cd telecom-churn-prediction-platform
```

### Run ML service

```
cd ml-service
pip install -r requirements.txt
python app.py
```

### Run backend

```
cd backend
npm install
npm start
```

### Run frontend

```
cd frontend
npm install
npm start
```

---

# License

MIT License

---
