(function(){
  let postsGrid, pageNumbersList, postsListElem;
  let postsArray = []; 
  let usersArray = [];
  let postData;
  let API_URL = 'https://gorest.co.in/public-api/';
  let currentPage, currentPostId;
  let pageCount;
  let LOCAL_URL = window.location.origin + window.location.pathname;
  if (!LOCAL_URL.includes('html')) LOCAL_URL += 'index.html';

  // создаем и возвращаем заголовок приложения
  function createAppTitle(title) {
      let appTitle = document.createElement('h1');
      appTitle.innerHTML = title;
      appTitle.classList.add('blog-post-title');
      return appTitle;
  }

  // создаем и возвращаем список элементов
  function createPageNumbersList() {
      let list = document.createElement('ul');
      list.classList.add('nav');
      return list;
  }

  // создаем и возвращаем список элементов
  function createPostsList() {
      let list = document.createElement('ul');
      list.classList.add('row');
      return list;
  }

  async function createPostsGrid() {
    let localPageParams = new URLSearchParams(window.location.search);
    currentPage = localPageParams.get('page') ? localPageParams.get('page') : 1;
    let postsArrayPromise = await (await fetch(API_URL + 'posts?page=' + currentPage)).json();
   
    postsArray = postsArrayPromise.data;
    usersArray = await getUsersArray();

    currentPage = postsArrayPromise.meta.pagination.page;
    pageCount = postsArrayPromise.meta.pagination.pages;
    
    loadPageNumbersList();
    loadPostsList();
  }

  function loadPageNumbersList() {
    let numsArray = [1];
    for (let i = currentPage - 2; i < currentPage + 3; i++) {
      if (i > 1 && i < pageCount) numsArray.push(i);
    }
    numsArray.push(pageCount);

    numsArray.forEach((pageNum, ind) => {
      let pageNumElem = document.createElement('li');
      let pageNumLink = document.createElement('a');
      let pageUrlParam = (Number(pageNum) > 1) ? ( '?page=' + pageNum ) : '';

      if (pageNum - numsArray[ind - 1] > 1) {
        let threeDotsElem = document.createElement('li');
        let threeDotsDiv = document.createElement('div');
        threeDotsDiv.textContent = '...';
        threeDotsDiv.classList.add('nav-link', 'align-bottom');
        threeDotsElem.classList.add('nav-item');

        threeDotsElem.append(threeDotsDiv);
        pageNumbersList.append(threeDotsElem);
      }

      pageNumLink.textContent = pageNum;

      pageNumLink.setAttribute('href', LOCAL_URL + pageUrlParam );

      pageNumLink.classList.toggle('active', pageNum === currentPage);

      pageNumLink.classList.add('nav-link');
      pageNumElem.classList.add('nav-item');

      pageNumElem.append(pageNumLink);
      pageNumbersList.append(pageNumElem);
    });
  }  

  function loadPostsList() {
    let postsElemArray = [];
    postsListElem.innerHTML = '';

    postsArray.forEach(post => {
      postsElemArray.push(createPostCardElem(post));
    });

    postsElemArray.sort(sortAsc);
    postsElemArray.forEach(post => postsListElem.append(post));
  }

  // создаем и возвращаем элемент списка
  function createPostCardElem(newItemObj) {
      let postListItem = document.createElement('li');
      let postCard = document.createElement('div');
      let postTitle = document.createElement('h2');
      let postTitleLink = document.createElement('a');
      let postParagraph = document.createElement('p');
      let postParams = document.createElement('div');
      let postCreateDate = document.createElement('div');
      let postAuthor = document.createElement('div');     

      // устанавливаем стили для элемента списка, а также для размещения кнопок
      // в его правой части с помощью flex
      postTitleLink.textContent = newItemObj.id + '. ' + newItemObj.title;
      postTitleLink.setAttribute('href', LOCAL_URL.replace('index.html', 'post.html') + '?id=' + newItemObj.id);

      postParagraph.textContent = newItemObj.body;
      postCreateDate.textContent = String(convertDateToDDMMYYYY(new Date(newItemObj.created_at)));

      postParams.classList.add('text-muted', 'd-flex', 'justify-content-between', 'align-items-center');
      postParagraph.classList.add('card-text');
      postCard.classList.add('card', 'mb-4', 'card-body', 'box-shadow');
      postListItem.classList.add('list-group-item', 'col-md-4');

      postListItem.id = newItemObj.id;

      let postUser = usersArray.find(x => x.id === newItemObj.user_id);
      postAuthor.textContent = postUser.name;

      postParams.append(postAuthor);
      postParams.append(postCreateDate);
    
      postTitle.append(postTitleLink);

      postCard.append(postTitle);
      postCard.append(postParagraph);
      postCard.append(postParams);

      postListItem.append(postCard);
      
      return postListItem;
  }

  async function getUsersArray() {
    let users = [];
    let userIds = postsArray.map(post => post.user_id);
    let uniqueUserIds = Array.from(new Set(userIds));

    let usersDataArray = await Promise.all(uniqueUserIds.map(async function (user_id) {
      return await (await fetch(API_URL + 'users/' + user_id)).json()
    }));

    usersDataArray.forEach(userData => {
      users.push({
        id: userData.data.id,
        name: userData.data.name,
      });
    });

    return users;
  }

  function convertDateToDDMMYYYY(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    year = (year < 10) ? '000' + year : (year < 100) ? '00' + year : (year < 1000) ? '0' + year : year;
    month = (month < 10) ? '0' + month : month;
    if (day < 10) day = '0' + day;

    return day + '.' + month + '.' + year;
  }

  function sortAsc(firstObj, secondObj) {
    return Number(firstObj.id) > Number(secondObj.id) ? 1 : -1;
  }

  // создаем страницу приложения
  function createPostsApp(container) {
    let postsAppTitle = createAppTitle('My posts collection');
    
    postsGrid = document.createElement('main');
    pageNumbersList = createPageNumbersList();
    postsListElem = createPostsList();

    postsGrid.append(pageNumbersList);
    postsGrid.append(postsListElem);

    container.append(postsAppTitle);
    container.append(postsGrid);
    
    createPostsGrid();
  }

  async function loadPostBody(postBody) {
    let postDataPromise = await (await fetch(API_URL + 'posts/' + currentPostId)).json();
    postData = postDataPromise.data;
    let postAuthorData = await (await fetch(API_URL + 'users/' + postData.user_id)).json();
    let lineElem = document.createElement('hr');

    let postTitle = postData.title ? createAppTitle('Post #' + currentPostId + ': ' + postData.title) : createAppTitle('Post #' + currentPostId + ': Some title');
    let postAuthor = postAuthorData.data.name ?? 'Somebody';
    let postCreateDate = postData.created_at ? String(convertDateToDDMMYYYY(new Date(postData.created_at))) : 'Sometime';
    let postMeta = document.createElement('div');
    let postTextElem = document.createElement('p');

    postMeta.textContent = postCreateDate + ' by ' + postAuthor;

    postMeta.classList.add('blog-post-meta');
    postBody.classList.add('blog-post', 'blog-main');

    postTextElem.textContent = postData.body ?? 'Some text';

    postBody.append(postTitle);
    postBody.append(postMeta);
    postBody.append(lineElem);
    postBody.append(postTextElem);
  }

  async function loadPostCommentsList(postComments) {
    let commentsDataPromise = await (await fetch(API_URL + 'posts/' + currentPostId + '/comments')).json();
    let commentsData = commentsDataPromise.data;

    let commentsTitle = document.createElement('h4');

    commentsTitle.textContent = 'Comments';

    postComments.append(commentsTitle);

    commentsTitle.classList.add('border-bottom', 'border-gray', 'pb-2', 'mb-0');
    postComments.classList.add('my-3', 'p-3', 'bg-white', 'rounded', 'box-shadow');

    if (!commentsData.length) {
      let commentsListEmpty = document.createElement('div');
      commentsListEmpty.textContent = 'No comments yet';
      postComments.append(commentsListEmpty);
    }
    
    commentsData.forEach(commentData => {
      let commentElem = document.createElement('li');
      let commentAuthor = document.createElement('strong');
      let commentText = document.createElement('p');
      let commentAvatar = document.createElement('div');

      commentAuthor.textContent = commentData.name;

      commentText.innerHTML = commentAuthor.outerHTML + '<br>' + commentData.body;

      commentAvatar.style.backgroundColor = 'grey';
      commentAvatar.style.height = '32px';
      commentAvatar.style.width = '32px';
      commentAvatar.classList.add('mr-2', 'rounded');
      commentAuthor.classList.add('d-block', 'text-gray-dark');
      commentText.classList.add('media-body', 'pb-3', 'mb-0', 'small', 'lh-125', 'border-bottom', 'border-gray');
      commentElem.classList.add('media', 'text-muted', 'pt-3');

      commentElem.append(commentAvatar);
      commentElem.append(commentText);

      postComments.append(commentElem);
    });

  }

  // создаем страницу поста
  function createPostPageApp(container) {
    let localPageParams = new URLSearchParams(window.location.search);
    currentPostId = localPageParams.get('id');

    let backToPostsListLink = document.createElement('a');
    let backToPostsListButton = document.createElement('div');
    let postBody = document.createElement('main');
    let postComments = document.createElement('ul');

    backToPostsListLink.setAttribute('href', LOCAL_URL.replace('post.html', 'index.html'));
    backToPostsListLink.textContent = 'Back to Posts List';

    backToPostsListButton.classList.add('back-button');

    backToPostsListButton.append(backToPostsListLink);
    container.append(backToPostsListButton);
    container.append(postBody);
    container.append(postComments);

    loadPostBody(postBody);
    loadPostCommentsList(postComments);
  }

  window.createPostsApp = createPostsApp;
  window.createPostPageApp = createPostPageApp;
})();