
class User {
  constructor(firstName, lastName, email, password) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
  }
}

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
        
        window.location.href = "Signin.html"; // Signin Page par bhej do
    }
}

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        return alert("Please enter email and password");
    }

    let savedData = JSON.parse(localStorage.getItem("User")) || [];

    let foundUser = savedData.find(
        (element) => element.email === email && element.password === password
    );

    if (foundUser) {
        alert("Login successfully");
        
        localStorage.setItem("linkedin_active_session", JSON.stringify(foundUser)); 
        
        window.location.href = "home.html"; 
        
    } else {
        alert("Invalid email or password");
    }
}
