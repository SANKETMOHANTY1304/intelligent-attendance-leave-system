const profileForm = document.getElementById('profile-form');
const predictionDiv = document.getElementById('prediction');
const recommendationsDiv = document.getElementById('recommendations');

profileForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const name = document.getElementById('name').value;
  const interests = document.getElementById('interests').value.split(','); 
  const academics = document.getElementById('academics').value;
  const predictedCourse = predictCourse(interests, academics); 
  const similarCourses = recommendSimilarCourses(predictedCourse); 
  predictionDiv.textContent = `Hi ${name}, based on your profile, you have a high chance of success in ${predictedCourse}`;
  recommendationsDiv.textContent = `We also recommend considering these similar courses: ${similarCourses.join(', ')}`; 
});
function predictCourse(interests, academics) {
  console.warn("AI prediction functionality not implemented yet!");
  return "Data Science";
}
function recommendSimilarCourses(predictedCourse) {
  console.warn("AI recommendation functionality not implemented yet!");
  return ["Computer Science", "Statistics"]; 
}