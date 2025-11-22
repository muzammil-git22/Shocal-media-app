// --- 0. Class Definition ---
class LinkedInFeed {
    // 1. Constructor: Class ki shuruat
    constructor() {
        // LocalStorage keys define karte hain
        this.activeSessionKey = 'linkedin_active_session';
        this.postsKey = 'linkedin_posts_db';

        // Login check aur user data load karte hain
        this.loggedInUser = JSON.parse(localStorage.getItem(this.activeSessionKey));
        this.checkLogin(); // ⭐ Yahan par history control hoga

        // Agar user logged in hai, toh baki data load karte hain
        this.currentUser = this.initializeCurrentUser();
        this.userLikesKey = `linkedin_likes_${this.currentUser.id}`;
        this.userHiddenPostsKey = `linkedin_hidden_posts_${this.currentUser.id}`;
        
        // Data initialize karte hain (localStorage ya default se)
        this.userLikes = JSON.parse(localStorage.getItem(this.userLikesKey)) || {};
        this.userHiddenPosts = JSON.parse(localStorage.getItem(this.userHiddenPostsKey)) || [];
        this.posts = this.loadPosts();

        // Global State variables (modals ke liye)
        this.currentPostImageURL = null; // New post ka image
        this.editingPostId = null;       // Edit ho rahe post ki ID
        this.editingPostImageURL = null; // Edit post ka image
        
        // Hidden input file uploaders DOM mein attach karte hain
        this.imageUploader = this.createUploader('image/*');
        this.postImageUploader = this.createUploader('image/*');

        // Sabse pehle UI update aur event listeners set karte hain
        this.initEventListeners();
        this.updateUserInfo();
        this.renderFeed();
    }

    // 2. Initialization Helpers: Shuruati zarooraten
    checkLogin() {
        // Agar user session data nahi hai, toh login page par bhej dete hain
        if (!this.loggedInUser) {
            alert("Please sign in to view the feed.");
            window.location.href = "Signin.html"; 
        } else {
            // ⭐ LOGIC: History ki pichli entry ko replace karna (Jisse Signin page par wapas na ja sake)
            // history.replaceState() maujooda (current) history entry ko replace karta hai. 
            // Isse browser ka "Back" button dabane par user Signin.html ko "skip" kar deta hai.
            window.history.replaceState(null, document.title, window.location.href);

            // Back button ko aur rokne ke liye: Agar user back jata hai, toh usse dobara yahan (feed) par bhej dete hain.
            window.addEventListener('popstate', () => {
                if (window.location.href.includes("Signin.html")) {
                    window.history.replaceState(null, document.title, "Feed.html");
                }
            });
        }
    }

    // ... (baki ke sare methods wahi rahenge) ...

    initializeCurrentUser() {
        // Logged in user data ko standardize karte hain
        return {
            name: `${this.loggedInUser.firstName} ${this.loggedInUser.lastName}`,
            headline: this.loggedInUser.headline || "Frontend Developer | Student", 
            avatar: this.loggedInUser.avatar || "https://github.com/shadcn.png", 
            id: this.loggedInUser.email
        };
    }

    loadPosts() {
        // Default posts ka array define karte hain
        const defaultPosts = [
            { id: 1, author: "Elon Musk", authorImg: "...", headline: "CEO of Tesla & SpaceX", timestamp: Date.now() - 7200000, content: "Mars is looking great! 🚀 #SpaceX", postImage: null, likes: 4500 },
            { id: 2, author: "Satya Nadella", authorImg: "...", headline: "CEO of Microsoft", timestamp: Date.now() - 3600000, content: "AI is augmenting human creativity. Excited for the future of work! #Innovation", postImage: null, likes: 2100 }
        ];
        // LocalStorage se posts load karte hain ya default posts use karte hain
        return JSON.parse(localStorage.getItem(this.postsKey)) || defaultPosts;
    }

    createUploader(acceptType) {
        // Hidden file input element banate hain
        const uploader = document.createElement('input'); 
        uploader.type = 'file'; 
        uploader.accept = acceptType; 
        uploader.style.display = 'none';
        document.body.appendChild(uploader);
        return uploader;
    }

    // 3. Utility Methods: Aam zaroorat wale functions
    timeAgo(timestamp) {
        // Time difference ko s, m, h, d mein convert karke dikhate hain
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s`; 
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`; 
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`; 
        const days = Math.floor(hours / 24);
        return `${days}d`;
    }

    // 4. UI Update Methods: Profile aur Feed ko update karna
    updateUserInfo() {
        // Sidebar aur Navbar ke avatar/name fields ko current user data se update karte hain
        const ids = ['navAvatar', 'menuAvatar', 'sidebarAvatar', 'feedInputAvatar', 'modalAvatar', 'editModalAvatar'];
        const nameIds = ['menuName', 'sidebarName', 'modalName', 'editModalName'];
        const headlineIds = ['menuHeadline', 'sidebarHeadline'];

        ids.forEach(id => { const el = document.getElementById(id); if(el) el.src = this.currentUser.avatar; });
        nameIds.forEach(id => { const el = document.getElementById(id); if(el) el.innerText = this.currentUser.name; });
        headlineIds.forEach(id => { const el = document.getElementById(id); if(el) el.innerText = this.currentUser.headline; });
    }

    saveAllData() {
        // Saara data LocalStorage mein save karte hain
        localStorage.setItem(this.postsKey, JSON.stringify(this.posts));
        localStorage.setItem(this.userLikesKey, JSON.stringify(this.userLikes));
        localStorage.setItem(this.userHiddenPostsKey, JSON.stringify(this.userHiddenPosts)); 
    }

    // 5. User Action Methods: Profile Image, Logout, Modals
    initEventListeners() {
        // Window click handler set karte hain modals ko band karne ke liye
        window.onclick = (event) => {
            if (event.target == document.getElementById('postModal')) this.closePostModal();
            if (event.target == document.getElementById('editPostModal')) this.closeEditPostModal();
        }
    }

    changeProfileImage() {
        // Profile picture badalne ke liye file uploader open karte hain
        this.imageUploader.click();
        this.imageUploader.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const newBase64Image = event.target.result;
                
                // Active session mein naya avatar save karte hain
                let userSessionData = JSON.parse(localStorage.getItem(this.activeSessionKey));
                userSessionData.avatar = newBase64Image; 
                localStorage.setItem(this.activeSessionKey, JSON.stringify(userSessionData)); 

                // Current user object aur UI update karte hain
                this.currentUser.avatar = newBase64Image; 
                this.updateUserInfo(); 
                this.renderFeed(); 
                alert("Profile image updated successfully!");
            };
            reader.readAsDataURL(file);
        };
    }

    logout() {
        // Session clear karke login page par redirect karte hain
        localStorage.removeItem(this.activeSessionKey);
        window.location.href = "Signin.html"; 
    }

    toggleProfileMenu() {
        // Profile dropdown menu ko dikhate/chupate hain
        const menu = document.getElementById('profileMenu');
        menu.classList.toggle('hidden');
        menu.classList.toggle('flex');
    }

    // 6. Post Modals Logic
    openPostModal() { document.getElementById('postModal').classList.remove('hidden'); }
    
    closePostModal() { 
        // Create post modal band karte hain aur state reset karte hain
        document.getElementById('postModal').classList.add('hidden'); 
        document.getElementById('postTextarea').value = "";
        this.removePostImage(); 
    }

    openImageUploadForPost() {
        // New post ke liye image uploader open karte hain
        this.postImageUploader.click();
        this.postImageUploader.onchange = (e) => this.handleImageUpload(e, 'previewImage', 'postImagePreview', 'currentPostImageURL');
    }

    removePostImage() {
        // New post se image hatate hain
        this.currentPostImageURL = null;
        document.getElementById('postImagePreview').classList.add('hidden');
        document.getElementById('previewImage').src = '';
    }

    addPost() {
        // Naya post create karke posts array mein shamil karte hain
        const content = document.getElementById('postTextarea').value.trim();
        
        if(!content && !this.currentPostImageURL) return alert("Please write something or add an image!");

        const newPost = {
            id: Date.now(),
            author: this.currentUser.name,
            authorImg: this.currentUser.avatar,
            headline: this.currentUser.headline,
            timestamp: Date.now(), 
            content: content,
            postImage: this.currentPostImageURL, 
            likes: 0, 
        };

        this.posts.unshift(newPost);
        this.renderFeed();
        this.closePostModal();
    }

    // 7. Edit Post Modals Logic
    openEditPostModal(postId) {
        // Edit post modal open karte hain aur data load karte hain
        this.editingPostId = postId;
        const postToEdit = this.posts.find(p => p.id === postId);
        if (!postToEdit) return;

        document.getElementById('editPostTextarea').value = postToEdit.content;
        document.getElementById('editModalName').innerText = this.currentUser.name;
        document.getElementById('editModalAvatar').src = this.currentUser.avatar;

        this.editingPostImageURL = postToEdit.postImage;
        const previewEl = document.getElementById('editPostImagePreview');
        const imgEl = document.getElementById('editPreviewImage');

        if (this.editingPostImageURL) {
            imgEl.src = this.editingPostImageURL;
            previewEl.classList.remove('hidden');
        } else {
            previewEl.classList.add('hidden');
            imgEl.src = '';
        }

        document.getElementById('editPostModal').classList.remove('hidden');
    }

    closeEditPostModal() {
        // Edit post modal band karte hain aur state reset karte hain
        document.getElementById('editPostModal').classList.add('hidden');
        this.editingPostId = null;
        this.editingPostImageURL = null;
        document.getElementById('editPostTextarea').value = "";
        document.getElementById('editPostImagePreview').classList.add('hidden');
    }

    openImageUploadForEditPost() {
        // Edit post ke liye image uploader open karte hain
        this.postImageUploader.click(); 
        this.postImageUploader.onchange = (e) => this.handleImageUpload(e, 'editPreviewImage', 'editPostImagePreview', 'editingPostImageURL');
    }

    removeEditPostImage() {
        // Edit post se image hatate hain
        this.editingPostImageURL = null;
        document.getElementById('editPostImagePreview').classList.add('hidden');
        document.getElementById('editPreviewImage').src = '';
    }

    saveEditedPost() {
        // Edited post ko posts array mein update karte hain
        const editedContent = document.getElementById('editPostTextarea').value.trim();
        if (!editedContent && !this.editingPostImageURL) {
            alert("Please write something or add an image!");
            return;
        }

        this.posts = this.posts.map(post => {
            if (post.id === this.editingPostId) {
                return {
                    ...post,
                    content: editedContent,
                    postImage: this.editingPostImageURL, 
                };
            }
            return post;
        });

        this.renderFeed();
        this.closeEditPostModal();
    }
    
    handleImageUpload(e, previewId, containerId, stateProperty) {
        // File ko base64 mein convert karke preview dikhate hain
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            this[stateProperty] = event.target.result; // State variable update karte hain
            document.getElementById(previewId).src = this[stateProperty];
            document.getElementById(containerId).classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    // 8. Feed Rendering Logic
    renderFeed() {
        // Posts ko filter karke HTML mein render karte hain
        const container = document.getElementById('feedContainer');
        const searchInput = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase() : '';
        container.innerHTML = '';

        // Hidden posts aur search term se filter karte hain
        const visiblePosts = this.posts.filter(post => !this.userHiddenPosts.includes(post.id));
        const filteredPosts = visiblePosts.filter(post => {
            return post.author.toLowerCase().includes(searchInput) || (post.content && post.content.toLowerCase().includes(searchInput));
        });

        if (filteredPosts.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 mt-4">No posts found in your feed.</p>`;
        }

        filteredPosts.forEach(post => {
            const isMyPost = post.author === this.currentUser.name;
            
            // Buttons aur HTML elements tayyar karte hain
            const deleteButton = isMyPost ? `<button onclick="feedApp.deletePost(${post.id})" title="Delete Post" class="text-gray-400 hover:text-red-600 ml-2"><i class="fa-solid fa-trash"></i></button>` : '';
            const editButton = isMyPost ? `<button onclick="feedApp.openEditPostModal(${post.id})" title="Edit Post" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-pen-to-square"></i></button>` : '';
            const hideButton = !isMyPost ? `<button onclick="feedApp.hidePost(${post.id})" title="Hide Post" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark"></i></button>` : '';

            const displayTime = this.timeAgo(post.timestamp);
            const postImageHtml = post.postImage ? `<img src="${post.postImage}" class="w-full h-auto object-cover rounded-md mt-2 border" alt="Post Image">` : '';

            const isLiked = this.userLikes[post.id] === true;
            const likeColor = isLiked ? 'text-linkedin-blue' : 'text-gray-600';
            const likeIconType = isLiked ? 'fa-solid' : 'fa-regular';

            const html = `
                <div class="bg-white rounded-lg border p-3 animate-fadeIn">
                    <div class="flex gap-3 mb-2">
                        <img src="${post.authorImg}" class="w-12 h-12 rounded-full object-cover border cursor-pointer">
                        <div class="flex-1">
                            <div class="flex justify-between">
                                <div>
                                    <h3 class="font-semibold text-sm hover:text-linkedin-blue cursor-pointer">${post.author}</h3>
                                    <p class="text-xs text-gray-500">${post.headline}</p>
                                    <p class="text-xs text-gray-400 mt-0.5">${displayTime} • <i class="fa-solid fa-earth-americas"></i></p>
                                </div>
                                <div class="flex items-center gap-2">
                                    ${editButton}
                                    ${deleteButton}
                                    ${hideButton} 
                                </div>
                            </div>
                        </div>
                    </div>
                    <p class="text-sm text-gray-900 mb-2 whitespace-pre-wrap">${post.content}</p>
                    
                    ${postImageHtml}

                    <div class="flex items-center gap-1 text-xs text-gray-500 border-b pb-2 mb-1">
                            <i class="fa-solid fa-thumbs-up text-linkedin-blue"></i> <span>${post.likes || 0}</span>
                    </div>
                    <div class="flex justify-between pt-1">
                            <button onclick="feedApp.toggleLike(${post.id})" class="flex-1 py-3 hover:bg-gray-100 rounded flex items-center justify-center gap-2 text-sm font-semibold text-gray-600">
                                <i class="${likeIconType} fa-thumbs-up ${likeColor} text-lg"></i> <span class="${likeColor}">Like</span>
                            </button>
                            <button class="flex-1 py-3 hover:bg-gray-100 rounded flex items-center justify-center gap-2 text-sm font-semibold text-gray-600"><i class="fa-regular fa-comment-dots text-lg"></i> Comment</button>
                            <button class="flex-1 py-3 hover:bg-gray-100 rounded flex items-center justify-center gap-2 text-sm font-semibold text-gray-600"><i class="fa-solid fa-retweet text-lg"></i> Repost</button>
                            <button class="flex-1 py-3 hover:bg-gray-100 rounded flex items-center justify-center gap-2 text-sm font-semibold text-gray-600"><i class="fa-solid fa-paper-plane text-lg"></i> Send</button>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });
        
        this.saveAllData(); // Data save karte hain har render ke baad
    }

    // 9. Post Actions
    toggleLike(id) {
        // Like/Unlike karte hain aur like count update karte hain
        const postIndex = this.posts.findIndex(p => p.id === id);
        if (postIndex === -1) return;

        const isCurrentlyLiked = this.userLikes[id] === true;

        if (isCurrentlyLiked) {
            this.posts[postIndex].likes = (this.posts[postIndex].likes || 1) - 1;
            delete this.userLikes[id];
        } else {
            this.posts[postIndex].likes = (this.posts[postIndex].likes || 0) + 1;
            this.userLikes[id] = true;
        }

        this.renderFeed();
    }

    deletePost(id) {
        // Post ko delete karte hain
        if(confirm("Are you sure you want to permanently delete this post?")) {
            this.posts = this.posts.filter(p => p.id !== id);
            this.renderFeed();
        }
    }

    hidePost(id) {
        // Post ko feed se chupate hain
        if (confirm("Are you sure you want to hide this post from your feed?")) {
            if (!this.userHiddenPosts.includes(id)) {
                this.userHiddenPosts.push(id);
            }
            this.renderFeed(); 
        }
    }
}

// Global variable mein class ka instance banate hain jisse HTML onclick functions use kar saken
let feedApp;

// Jab poora page load ho jaye to class initialize karte hain
document.addEventListener('DOMContentLoaded', () => {
    feedApp = new LinkedInFeed();
    
    // Manual event listeners for buttons that use class methods (HTML mein onclick se hatakar)
    document.getElementById('postButton').onclick = () => feedApp.addPost();
    document.getElementById('saveEditButton').onclick = () => feedApp.saveEditedPost();
    
    // Profile menu ke button ke liye
    const navAvatarElement = document.getElementById('navAvatar');
    if(navAvatarElement) {
        navAvatarElement.parentElement.onclick = () => feedApp.toggleProfileMenu();
    }
    // Logout button
    const logoutButton = document.querySelector('[onclick="logout()"]');
    if(logoutButton) {
         // Agar HTML mein 'logout()' call ho raha hai, toh use 'feedApp.logout()' se replace karein
         logoutButton.onclick = () => feedApp.logout(); 
    }
    // Image uploader buttons
    document.querySelector('[onclick="changeProfileImage()"]').onclick = () => feedApp.changeProfileImage();
    document.querySelector('[onclick="openPostModal()"]').onclick = () => feedApp.openPostModal();
    document.querySelector('[onclick="openImageUploadForPost()"]').onclick = () => feedApp.openImageUploadForPost();
    document.querySelector('[onclick="openImageUploadForEditPost()"]').onclick = () => feedApp.openImageUploadForEditPost();
    document.querySelector('[onclick="removePostImage()"]').onclick = () => feedApp.removePostImage();
    document.querySelector('[onclick="removeEditPostImage()"]').onclick = () => feedApp.removeEditPostImage();
    document.querySelector('[onclick="closePostModal()"]').onclick = () => feedApp.closePostModal();
    document.querySelector('[onclick="closeEditPostModal()"]').onclick = () => feedApp.closeEditPostModal();
});