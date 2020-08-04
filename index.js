const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const cookieSession = require("cookie-session");
const { hash, compare } = require("./bc.js");
const csurf = require("csurf");
const db = require("./db");

app.engine("handlebars", handlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

//////////// middleware section ////////////

app.use(
    cookieSession({
        secret: "cookie",
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(
    express.static("./public"),
    express.urlencoded({
        extended: false,
    })
);

app.use(csurf());

app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    res.setHeader("x-frame-options", "deny");
    if (req.url == "/") {
        res.redirect("/register");
    } else {
        next();
    }
});

////////// register ////////////////////

app.get("/register", (req, res) => {
    res.render("registration", {
        title: "Register",
    });
});

app.post("/register", (req, res) => {
    const first = req.body.first;
    const last = req.body.last;
    const email = req.body.emailRegistration;
    const password = req.body.passwordRegistration;

    hash(password)
        .then((hashedPw) => {
            db.register(first, last, email, hashedPw)
                .then(function (userInfo) {
                    req.session.id = userInfo.rows[0].id;
                    req.session.first = userInfo.rows[0].first;
                    req.session.last = userInfo.rows[0].last;
                    res.redirect("/profile");
                    //res.sendStatus(200);
                })
                .catch(function (error) {
                    res.render("registration", {
                        error,
                    });
                });
        })
        .catch(function (error) {
            res.render("registration", {
                error,
            });
            res.sendStatus(500);
        });
});

/////////// profile ////////////////////

app.get("/profile", (req, res) => {
    if (req.session.id) {
        res.render("profile", {
            title: "Profile",
        });
    } else {
        res.redirect("/register");
    }
});

app.post("/profile", (req, res) => {
    const age = req.body.age;
    const city = req.body.city;
    const homepage = req.body.homepage;
    const id = req.session.id;

    if (
        homepage.startsWith("http://") ||
        homepage.startsWith("https://") ||
        homepage.startsWith("//")
    ) {
        db.profileInsert(id, age, city, homepage)
            .then(function () {
                res.redirect("/petition");
            })
            .catch(function (error) {
                console.log(error);
                res.render("profile", {
                    error,
                });
            });
    } else {
        res.render("profile", {
            urlError: "Please insert a valid url!",
        });
    }
});

////////////// login ///////////////////

app.get("/login", (req, res) => {
    if (!req.session.id) {
        res.render("login", {
            title: "Login",
        });
    } else {
        if (req.session.sigId) {
            res.redirect("/petition/thanks");
        } else {
            res.redirect("/petition");
        }
    }
});

app.post("/login", (req, res) => {
    const email = req.body.emailLogin;
    const password = req.body.passwordLogin;

    db.loginSelectUser(email)
        .then(function (userInfo) {
            compare(password, userInfo.rows[0].password)
                .then(function (compared) {
                    if (compared == true) {
                        req.session.id = userInfo.rows[0].id;
                        req.session.first = userInfo.rows[0].first;
                        req.session.last = userInfo.rows[0].last;
                        const id = req.session.id;

                        db.loginSelectSignatures(id)
                            .then(function (sigId) {
                                req.session.sigId = sigId.rows[0].id;
                                res.redirect("petition/thanks");
                            })
                            .catch(function () {
                                res.render("petition", {
                                    title: "Petition",
                                });
                            });
                    } else {
                        res.render("login", {
                            error,
                        });
                    }
                })
                .catch(function (error) {
                    res.render("login", {
                        error,
                    });
                });
        })
        .catch(function (error) {
            res.render("login", {
                error,
            });
        });
});

//////////// logout ///////////////

/* app.get("/logout", (req, res) => {
    if (req.session.id) {
        res.render("logout", {
            title: "Log out",
        });
    } else {
        res.redirect("/register");
    }
});

app.post("/logout", (req, res) => {
    req.session = null;
    res.redirect("/register");
}); */

//////////// petition //////////////

app.get("/petition", (req, res) => {
    if (req.session.id) {
        res.render("petition", {
            title: "Petition",
        });
    } else {
        res.redirect("/register");
    }
});

app.post("/petition", function (req, res) {
    const signature = req.body.canvInputName;
    const id = req.session.id;

    db.petitionInsertSignatures(signature, id)
        .then(function (signatureObj) {
            req.session.sigId = req.session.id;
            req.session.permission = true;
            //req.session.id = signatureObj.rows[0].id;
            res.redirect("/petition/thanks");
        })
        .catch(function (error) {
            res.render("petition", {
                error,
            });
            console.log(error);
        });
});

/////////// Edit Profile/////////////

app.get("/profile/edit", (req, res) => {
    const userId = req.session.id;

    db.getDataUser(userId)
        .then(function (dataUser) {
            const firstEdit = dataUser.rows[0].first;
            const lastEdit = dataUser.rows[0].last;
            const emailEdit = dataUser.rows[0].email;
            const passwordEdit = dataUser.rows[0].password;
            const ageEdit = dataUser.rows[0].age;
            const cityEdit = dataUser.rows[0].city;
            const homepageEdit = dataUser.rows[0].url;

            res.render("edit", {
                title: "Edit Profile",
                first: firstEdit,
                last: lastEdit,
                email: emailEdit,
                // password: passwordEdit,
                age: ageEdit,
                city: cityEdit,
                homepage: homepageEdit,
            });
        })
        .catch(function (error) {
            res.render("edit", {
                title: "EDIT Profile",
                error,
            });
        });
});

app.post("/profile/edit", (req, res) => {
    const id = req.session.id;
    const first = req.body.firstEdit;
    const last = req.body.lastEdit;
    const email = req.body.emailEdit;
    const password = req.body.passwordEdit;
    const age = req.body.ageEdit;
    const city = req.body.cityEdit;
    const homepage = req.body.homepageEdit;

    if (password != "") {
        hash(password)
            .then(function (hashedPw) {
                return db.updateUserPassword(id, first, last, email, hashedPw);
            })
            .then(function () {
                return db
                    .updateUserProfile(id, age, city, homepage)
                    .then(function () {
                        res.render("edit", {
                            title: "Edit Profile",
                            note: "Your profile has been updated",
                            first,
                            last,
                            email,
                            age,
                            city,
                            homepage,
                        });
                    });
            })
            .catch(function (error) {
                res.render("edit", {
                    title: "Edit Profile",
                    error,
                });
            });
    } else {
        db.updateUser(id, first, last, email)
            .then(function () {
                return db
                    .updateUserProfile(id, age, city, homepage)
                    .then(function () {
                        res.render("edit", {
                            title: "Edit Profile",
                            note: "Your profile has been updated",
                            first,
                            last,
                            email,
                            age,
                            city,
                            homepage,
                        });
                    });
            })
            .catch(function (error) {
                res.render("edit", {
                    title: "Edit Profile",
                    error,
                });
            });
    }
});

/////////// thanks /////////////////

app.get("/petition/thanks", (req, res) => {
    const { id, permission, sigId } = req.session;
    if (permission && id && sigId) {
        db.thanksSelectSignatures(id)
            .then(function (signatureReq) {
                res.render("thanks", {
                    title: "Thank You",
                    signatureReq: signatureReq.rows[0].signature,
                });
            })
            .catch(function (err) {
                console.log(err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.post("/petition/thanks", (req, res) => {
    const id = req.session.id;

    db.deleteSignature(id)
        .then(function () {
            req.session.sigId = null;
            res.redirect("/petition");
        })
        .catch(function (error) {
            res.render("thanks", {
                error,
            });
        });
});

//////////// signers /////////////////

app.get("/petition/signers", (req, res) => {
    const { id, permission, sigId } = req.session;
    if (permission && id && sigId) {
        db.signersSelectFromSignatures()
            .then(function (namesSigners) {
                res.render("signers", {
                    title: "People signed",
                    namesSigners: namesSigners.rows,
                });
            })
            .catch(function (error) {
                res.render("signers", {
                    title: "People signed",
                    error,
                });
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers/:city", (req, res) => {
    const cityName = req.params.city;
    const { id, permission, sigId } = req.session;
    if (permission && id && sigId) {
        db.filterSigners(cityName)
            .then(function (filteredSigners) {
                res.render("filteredSigners", {
                    title: `Signers for ${cityName}`,
                    filteredSigners: filteredSigners.rows,
                    city: cityName,
                });
            })
            .catch(function (error) {
                res.render("signers", {
                    title: "People signed",
                    error,
                });
            });
    } else {
        res.render("registration", {
            title: "Register",
            noPermission: "No Permission",
        });
    }
});

app.listen(process.env.PORT || 8080, () => console.log("server listening!"));
