<template>
  <CocktailCard
    :cocktail="cocktailData"
    @add-to-cart="handleAddToCart"
    @toggle-favorite="handleToggleFavorite"
    @show-details="handleShowDetails"
  />
</template>

<script setup>
import CocktailCard from './CocktailCard.vue'



const cocktailData = {
  name: "Mojito Royal",
  category: "Tropical",
  description: "Un cocktail rafraîchissant avec rhum blanc, menthe fraîche, citron vert et eau gazeuse.",
  ingredients: ["Rhum blanc", "Menthe", "Citron vert", "Sucre", "Eau gazeuse"],
  sizes: [
    { name: "S", price: 8.50 },
    { name: "M", price: 10.00 },
    { name: "L", price: 12.50 }
  ]
}
function handleAddToCart(item) {
  console.log('Ajout au panier :', item)
}

function handleToggleFavorite(data) {
  console.log('Toggle favori :', data)
}

function handleShowDetails(cocktail) {
  console.log('Voir détails :', cocktail)
}
</script>
