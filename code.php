<?php
// Check if the form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanitize input data
    $name = htmlspecialchars(trim($_POST['Name']));
    $class = htmlspecialchars(trim($_POST['Class']));
    $eligibility = htmlspecialchars(trim($_POST['Eligibility']));
    $rollNo = htmlspecialchars(trim($_POST['RollNo']));
    $mobileNo = htmlspecialchars(trim($_POST['MobileNo']));
    $gender = htmlspecialchars(trim($_POST['Gender']));
    $cast = htmlspecialchars(trim($_POST['Cast']));

    // Initialize an array to hold errors
    $errors = [];

    // Validate input data
    if (empty($name)) {
        $errors[] = "Name is required.";
    }
    if (empty($class)) {
        $errors[] = "Class is required.";
    }
    if (empty($eligibility)) {
        $errors[] = "Eligibility number is required.";
    }
    if (empty($rollNo)) {
        $errors[] = "Roll number is required.";
    }
    if (!preg_match('/^\d{10}$/', $mobileNo)) {
        $errors[] = "Mobile number must be 10 digits long.";
    }
    if (empty($gender)) {
        $errors[] = "Gender is required.";
    }
    if (empty($cast)) {
        $errors[] = "Caste is required.";
    }

    // Check if there are any errors
    if (empty($errors)) {
        // If no errors, you can proceed to save data to a database or send an email, etc.
        echo "<h3>Enrollment Successful!</h3>";
        echo "<p>Name: $name</p>";
        echo "<p>Class: $class</p>";
        echo "<p>Eligibility Number: $eligibility</p>";
        echo "<p>Roll Number: $rollNo</p>";
        echo "<p>Mobile Number: $mobileNo</p>";
        echo "<p>Gender: $gender</p>";
        echo "<p>Caste: $cast</p>";
    } else {
        // If there are errors, display them
        echo "<h3>There were errors with your submission:</h3>";
        echo "<ul>";
        foreach ($errors as $error) {
            echo "<li>$error</li>";
        }
        echo "</ul>";
    }
}
?>
