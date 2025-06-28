

// const API_KEY = '89dce1421c584c22a2ea328e0951dc60';
// const ingredients = document.querySelector('.js-ingredients').value; ;
// const url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${API_KEY}&ingredients=${ingredients}&number=5`;

// fetch(url)
//   .then(res => res.json())
//   .then(data => {
//     console.log(data);
//     // Each item includes id, title, image, missedIngredients, usedIngredients, etc.
//   })
//   .catch(err => console.error(err));

let recipes = [];
let favorites = []


window.addEventListener('DOMContentLoaded', () => {
    favorites = loadFavorites();
  const savedRecipes = loadFromStorage();
  if (savedRecipes) {
     recipes = savedRecipes; 
    displayRecipes(savedRecipes);
  }
});


document.querySelector('.js-search').addEventListener('click',()=>{
  fetchRecipes();
})

async function fetchRecipes() {
  const API_KEY = '89dce1421c584c22a2ea328e0951dc60'; // Replace with your actual key
  const ingredients = document.querySelector('.js-ingredients').value;
    const loader = document.querySelector('#loader');

  // Show loader
  loader.classList.remove('hidden');

  const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=5&apiKey=${API_KEY}`;

  try {
    const response = await fetch(url);
     recipes = await response.json();
    console.log(recipes); // This logs all the recipe info

   saveToStorage(recipes);

    displayRecipes(recipes); // Call a function to show them in HTML
  } catch (error) {
    console.error('Error fetching recipes:', error);
  }

  loader.classList.add('hidden');

}



function displayRecipes(recipes,isFavoritesView = false) {
  const resultsSection=document.querySelector('.results-section');

  let rescipeHTML='';
  
  if (recipes.length === 0) {
    // Show a friendly message if no recipes are found
    rescipeHTML = `
      <div class="no-results">
        <p>😕 No recipes found for the given ingredients.</p>
        <p>Please try different or fewer ingredients.</p>
      </div>
    `;
  } else {
    recipes.forEach((recipe)=>{

      const isFavorite = favorites.some(fav => fav.id === recipe.id);
  const btnText = isFavoritesView || isFavorite
    ? '❌ Remove from Favorites'
    : '❤️ Add to Favorites';
  const btnClass = isFavoritesView || isFavorite
    ? 'remove-favorite-btn'
    : 'favorite-btn';

    

    rescipeHTML+=`
     <div class="recipe-card">
        <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image" />
        <h3>${recipe.title}</h3>
        <p><strong>Used Ingredients:</strong> ${recipe.usedIngredientCount}</p>
        <p><strong>Missing Ingredients:</strong> ${recipe.missedIngredientCount}</p>
        <a href="https://spoonacular.com/recipes/${recipe.title.replace(/ /g, '-').toLowerCase()}-${recipe.id}" target="_blank">View Full Recipe</a>
        <button class="${btnClass}" data-id="${recipe.id}">${btnText}</button>
        <button class="view-steps-btn" data-id="${recipe.id}">👨‍🍳 View Cooking Steps</button>
      </div>
    `
    });
  }
    resultsSection.innerHTML = rescipeHTML;
    console.log(rescipeHTML);
  
}

  document.querySelector('.js-clear').addEventListener('click',()=>{
      const confirmClear = confirm("Are you sure you want to clear the search results?");
  if (confirmClear) {
    clearRescipes();
  }
  })




function saveToStorage(recipes) {
  localStorage.setItem('recipes',JSON.stringify(recipes));
}


function clearRescipes() {
 document.querySelector('.js-ingredients').value = '';

  // Clear the results section
  document.querySelector('.results-section').innerHTML = '';

  // Hide loader (if needed)
  document.querySelector('#loader').classList.add('hidden');

  // ❌ Clear recipes from localStorage
  localStorage.removeItem('recipes');
}

function loadFromStorage() {
  const saved = localStorage.getItem('recipes');
  return saved ? JSON.parse(saved) : null;
}



function loadFavorites() {
  const stored = localStorage.getItem('favorites');
  return stored ? JSON.parse(stored) : [];
}

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// 🍽 Event Delegation for Add to Favorites
document.querySelector('.results-section').addEventListener('click', (event) => {
  if (event.target.classList.contains('favorite-btn')) {
    const recipeId = parseInt(event.target.dataset.id);
    const recipeToAdd = recipes.find(r => r.id === recipeId);
    if (!recipeToAdd) return;

    const alreadyAdded = favorites.some(fav => fav.id === recipeToAdd.id);
    if (!alreadyAdded) {
      favorites.push(recipeToAdd);
      saveFavorites();
      alert(`${recipeToAdd.title} added to favorites!`);
    } else {
      alert(`${recipeToAdd.title} is already in your favorites.`);
    }
  }


  
  // ✅ REMOVE from favorites
  if (event.target.classList.contains('remove-favorite-btn')) {
        const recipeId = parseInt(event.target.dataset.id);
    favorites = favorites.filter(fav => fav.id !== recipeId);
    saveFavorites();
    alert(`Recipe removed from favorites.`);

    // 🔁 Redisplay updated favorites
    displayRecipes(favorites);

    // Reset buttons again after redisplay
    const buttons = document.querySelectorAll('.favorite-btn');
    buttons.forEach(btn => {
      btn.textContent = '❌ Remove from Favorites';
      btn.classList.remove('favorite-btn');
      btn.classList.add('remove-favorite-btn');
    });
  }
});




// 🌟 View Favorites Button (create this in HTML)
document.querySelector('.js-view-favorites').addEventListener('click', () => {
  const favs = loadFavorites();
  if (favs.length === 0) {
    document.querySelector('.results-section').innerHTML = '<p>No favorites yet.</p>';
  } else {
    displayRecipes(favs,true);
    
   

  }
});


document.querySelector('.results-section').addEventListener('click', async (event) => {
  if (event.target.classList.contains('view-steps-btn')) {
    const button = event.target;
    const recipeId = parseInt(button.dataset.id);
    const card = button.closest('.recipe-card');
    const existingSteps = card.querySelector('.recipe-steps');

    // 🔄 If steps are already shown, remove them and reset button
    if (existingSteps) {
      existingSteps.remove();
      button.textContent = "View Steps";
      return;
    }

    // 🍳 Fetch and show steps
    try {
      const response = await fetch(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=89dce1421c584c22a2ea328e0951dc60`);
      const data = await response.json();

      const instructions = data.analyzedInstructions?.[0]?.steps || [];

      if (instructions.length === 0) {
        alert("Sorry, no detailed steps available for this recipe.");
        return;
      }

      const stepsHTML = instructions.map(step => `<li>${step.step}</li>`).join('');
      const stepsList = `
        <div class="recipe-steps">
          <h4>🍳 Cooking Steps:</h4>
          <ol>${stepsHTML}</ol>
        </div>
      `;

      card.insertAdjacentHTML('beforeend', stepsList);
      button.textContent = "Hide Steps"; // 🟢 Update button text

    } catch (err) {
      console.error("Error fetching steps:", err);
      alert("Unable to fetch steps.");
    }
  }
});
