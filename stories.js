"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function storyIsFavorited(story) {
  return currentUser.favorites.some((favorite) => {
    return favorite.storyId === story.storyId;
  });
}

function storyIsCreatedByUser(story) {
  return currentUser.username === story.username;
}

function generateLoggedInStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);
  let svgClass;
  let remove;
  const hostName = story.getHostName();

  storyIsFavorited(story)
    ? (svgClass = "unfavorited favorited")
    : (svgClass = "unfavorited");

  storyIsCreatedByUser(story) ? (remove = "(remove story)") : (remove = "");
  return $(`
      <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <svg class="${svgClass}" viewBox="0 0 32 29.6">
          <path d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,11.9,16,21.2
	        c6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z"/>
        </svg> 
        <small class="story-user">posted by ${story.username}</small>
        <small><a class="story-remove" href="#" >${remove}</a></small>
      </li>
    `);
}

function generateLoggedOutStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);
  const hostName = story.getHostName();

  return $(`
      <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

async function putStoriesOnPage() {
  let $story;
  $allStoriesList.empty();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  storyList = await StoryList.getStories();
  currentUser = await User.loginViaStoredCredentials(token, username);

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    if (currentUser === null) {
      $story = generateLoggedOutStoryMarkup(story);
    } else {
      $story = generateLoggedInStoryMarkup(story);
    }
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

async function putFavoriteStoriesOnPage() {
  $allStoriesList.empty();
  storyList = await StoryList.getStories();
  const userFavorites = await getCurrentUserFavorites();
  // loop through all of our stories and generate HTML for them
  for (let favorite of userFavorites) {
    const $story = generateLoggedInStoryMarkup(favorite);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

async function submitStory(evt) {
  console.debug("submitStory", evt);
  evt.preventDefault();

  const title = $("#story-title").val();
  const author = $("#story-author").val();
  const url = $("#story-url").val();
  const newStory = {
    title: title,
    author: author,
    url: url,
  };
  await storyList.addStory(currentUser, newStory);
  storyList = await StoryList.getStories();
  putStoriesOnPage();

  $storyForm.hide();
  $storyForm.trigger("reset");
}

$storyForm.on("submit", submitStory);

$allStoriesList.on("click", ".story-remove", async function (evt) {
  const storyId = $(this).closest("li").attr("id");
  await storyList.removeStory(currentUser, storyId);
  $(this).closest("li").remove();
});
