// Wait until page loads



$(document).ready(function() {

   let loggedAccount = JSON.parse(localStorage.getItem("logList")) || [];

  
    if (loggedAccount.length !== 0) {
        
    let currentUser = loggedAccount[0];

     window.location.href = currentUser.role + "-page.html";
    }
  
   

   
    if (!localStorage.getItem("accounts")) {
    const accounts = [
        new User(1, "NJ Cajada", "adminnj@gmail.com", "@Adminnj123", "Admin"),
        new User(2, "Infinix Corp", "infinixcorp@gmail.com", "@Infinixcorp123", "Supplier"),
        new User(3, "Apple", "apple@gmail.com", "@Apple123", "Supplier"),
        new User(4, "Samsung", "samsung@gmail.com", "@Samsung123", "Supplier"),
        new User(5, "Eyah Miranda", "eyah@gmail.com", "@Eyah123", "Staff")
    ];
    localStorage.setItem("accounts", JSON.stringify(accounts));
    }

    if (!localStorage.getItem("logList")) {
        localStorage.setItem("logList", JSON.stringify([]));
    }

    
        
        

    const emailCheck = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    $('body').css({
                'background-image': 'url(backgrounds/admin.jpg)',
                'background-size': 'cover',
                'background-position': 'center',
                'background-repeat': 'no-repeat'
            });

    $(".card").css({
        "background": "rgba(255, 255, 255, 0.85",
        "backdrop-filter": "blur(5px)",
        "transition": "background 0.7s ease, backdrop-filter 0.7s ease"
        
    });



    // When login button is clicked
    $("#btn-log-in").click(function(e) {
        e.preventDefault(); // Prevent form from submitting
        if($("#txt-email").val() == ""){
            $("#txt-email").addClass("is-invalid");
            $("#txt-email").next(".invalid-feedback").remove();
            $("#txt-email").after('<span class="invalid-feedback">-Email is required-</span>');
        }else if (!emailCheck.test($("#txt-email").val())) {
            $("#txt-email").addClass("is-invalid");
            $("#txt-email").next(".invalid-feedback").remove();
            $("#txt-email").after('<span class="invalid-feedback">-Valid Email is required-</span>');
        }else{
            $("#txt-email").next(".invalid-feedback").remove();
            $("#txt-email").removeClass("is-invalid");
        }

        if($("#txt-password").val() == ""){
            $("#txt-password").addClass("is-invalid");
            $("#txt-password").next(".invalid-feedback").remove();
            $("#txt-password").after('<span class="invalid-feedback">-Password is required-</span>');
        }else{
            $("#txt-password").next(".invalid-feedback").remove();
            $("#txt-password").removeClass("is-invalid");
        }

        let userEmail = $("#txt-email").val();
        let userPass = $("#txt-password").val();
        let userRole = $("#select-role").val();

        let storedAccounts = JSON.parse(localStorage.getItem("accounts")) || [];
        let loggedAccount = JSON.parse(localStorage.getItem("logList")) || [];

        let foundUser = null;

        for (let account of storedAccounts) {
            if (
                account.email === userEmail &&
                account.password === userPass &&
                account.role === userRole
            ) {
                foundUser = account;
                break; 
            }
        }

        if (foundUser) {
            const loggedUser = new User(foundUser.id, foundUser.name, foundUser.email, foundUser.password, foundUser.role);
            let loggedAccount = JSON.parse(localStorage.getItem("logList")) || [];
            loggedAccount.push(loggedUser);
            localStorage.setItem("logList", JSON.stringify(loggedAccount));

            window.location.href = userRole + "-page.html";
        } else {
            alert("Invalid Credentials");
            $("#txt-email").addClass("is-invalid");
            $("#txt-password").addClass("is-invalid");
        }

        

        


    });

    $("#select-role").change(function(){

        $("#txt-email").val("");
        $("#txt-password").val("");

        $("#txt-email").removeClass("is-invalid");
        $("#txt-password").removeClass("is-invalid");
        $("#txt-password").next(".invalid-feedback").remove();
        $("#txt-email").next(".invalid-feedback").remove();

        let selectedValue = $(this).val();

        if(selectedValue === "Staff"){
             $('body').css({
                'background-image': 'url(backgrounds/staff.jpg)',
                'background-size': 'cover',
                'background-position': 'center',
                'background-repeat': 'no-repeat',
                "transition": "background-image 0.7s ease, background-color 0.7s ease"
                
            });

            $(".card").css({
                "background": "rgba(255, 255, 255, 0.85)",
                "backdrop-filter": "blur(5px)",
                 "transition": "background 0.7s ease, backdrop-filter 0.7s ease"
            });
        }
        if(selectedValue === "Admin"){
          
            $('body').css({
                'background-image': 'url(backgrounds/admin.jpg)',
                'background-size': 'cover',
                'background-position': 'center',
                'background-repeat': 'no-repeat',
                 "transition": "background-image 0.7s ease, background-color 0.7s ease"
                
            });

            $(".card").css({
                "background": "rgba(255, 255, 255, 0.85)",
                "backdrop-filter": "blur(5px)",
                 "transition": "background 0.7s ease, backdrop-filter 0.7s ease"
            });
        }
        if(selectedValue === "Supplier"){
             $('body').css({
                'background-image': 'url(backgrounds/supplier.jpg)',
                'background-size': 'cover',
                'background-position': 'center',
                'background-repeat': 'no-repeat',
                 "transition": "background-image 0.7s ease, background-color 0.7s ease"
                
            });

            $(".card").css({
                "background": "rgba(255, 255, 255, 0.85)",
                "backdrop-filter": "blur(5px)",
                 "transition": "background 0.7s ease, backdrop-filter 0.7s ease"
            });
        }

        
    });

    


   

   

    




});