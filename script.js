// --- User Class ---
class User {
  constructor(firstName, lastName, email, password) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
  }
}

// --- Sign Up Function ---
function handleSignup(event) {
    event.preventDefault();

    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!firstName || !lastName || !email || !password) {
        alert("Please fill all the fields");
        return;
    }

    let savedData = JSON.parse(localStorage.getItem("User")) || [];
    let userExists = savedData.find((element) => element.email === email);

    if (userExists) {
        alert("User with this email already exists.");
    } else {
        const newUser = new User(firstName, lastName, email, password);
        savedData.push(newUser);
        localStorage.setItem("User", JSON.stringify(savedData));
        alert("Signup Successful! Please Login.");
        
        // --- Redirection ---
        window.location.href = "Signin.html"; // Signin Page par bhej do
    }
}

// --- Sign In Function (The Fix) ---
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        return alert("Please enter email and password");
    }

    let savedData = JSON.parse(localStorage.getItem("User")) || [];

    // User ko email aur password se dhoondo
    let foundUser = savedData.find(
        (element) => element.email === email && element.password === password
    );

    if (foundUser) {
        alert("Login successfully");
        
        // **⭐ PROPER FIX:** Session key ko hamesha 'linkedin_active_session' se save karo
        localStorage.setItem("linkedin_active_session", JSON.stringify(foundUser)); 
        
        // Feed Page par jao (Apne feed page ka naam likhein)
        window.location.href = "home.html"; 
        
    } else {
        alert("Invalid email or password");
    }
}

// Note: Ye functions tabhi kaam kareinge jab inko form submit event par call kiya jaye.