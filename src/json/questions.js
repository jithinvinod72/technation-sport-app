const questionsData = {
    "questions": [
      {
        "id": 1,
        "questionName": "sportType",
        "question": "What sport are you training for?",
        "questionType": "radio",
        "options": ["Football", "Basketball", "Running", "Cycling", "Swimming", "Other"],
        "parentQuestionId": null,
        "parentQuestionAnswer": null
      },
      {
        "id": 2,
        "questionName": "specificSportDetail",
        "parentQuestionId": 1,
        "parentQuestionAnswer": "Other",
        "question": "Please specify the sport.",
        "questionType": "text",
        "options": null
      },
      {
        "id": 3,
        "questionName": "weight",
        "question": "What is your weight (in kilograms)?",
        "questionType": "number",
        "options": null,
        "parentQuestionId": null,
        "parentQuestionAnswer": null
      },
      {
        "id": 4,
        "questionName": "height",
        "question": "What is your height (in centimeters)?",
        "questionType": "number",
        "options": null,
        "parentQuestionId": null,
        "parentQuestionAnswer": null
      },
      {
        "id": 5,
        "questionName": "mealsPerDay",
        "question": "How many meals do you take per day?",
        "questionType": "radio",
        "options": ["2", "3", "4", "More than 4"],
        "parentQuestionId": null,
        "parentQuestionAnswer": null
      },
      {
        "id": 6,
        "questionName": "dietaryPreferences",
        "question": "What are your dietary preferences?",
        "questionType": "radio",
        "options": ["Vegan", "Vegetarian", "Non-Vegan"],
        "parentQuestionId": null,
        "parentQuestionAnswer": null
      },
      {
        "id": 7,
        "questionName": "habits",
        "question": "Do you have any of these habits?",
        "questionType": "checkbox",
        "options": ["Smoking", "Non-Smoking"],
        "parentQuestionId": null,
        "parentQuestionAnswer": null
      },
      {
        "id": 8,
        "questionName": "trainingType",
        "question": "What kind of training are you doing?",
        "questionType": "radio",
        "options": ["Preparing for a sport tomorrow", "Preparing for a sport in 3 weeks", "Recovering"],
        "parentQuestionId": null,
        "parentQuestionAnswer": null
      },
      {
        "id": 9,
        "questionName": "nextGameDate",
        "question": "When is your next game (optional)?",
        "questionType": "date",
        "options": null,
        "parentQuestionId": null,
        "parentQuestionAnswer": null
      }
    ]
  }
  module.exports = questionsData;