import React, { useContext, useEffect, useState } from "react";
import { useAlert } from "react-alert";
import { useLocation } from "react-router";
import { uuid } from "uuidv4";
import { ActionContext, StateContext } from "../../hooks";
import { BgColor } from "../../models/BgColor";
import { OauthProvider } from "../../models/OauthProvider";
import { WebService } from "../../services";
import { getDelegateId, getUserId, validateEmail } from "../../utils";
import logo from "../../assets/icons/rxc-voice-beta-logo.png";
// import { containsLowerCase, containsNumber, containsSpecialCharacters, containsUpperCase, validatePasswordLength } from "../../utils";

import "./ValidationPage.scss";

function ValidationPage() {
    const github_client_id = 'f9be73dc7af4857809e0';
    const location = useLocation();
    const linkUid = new URLSearchParams(location.search).get('uidb64');
    const linkToken = new URLSearchParams(location.search).get('token');
    const { setUserData, setColor } = useContext(ActionContext);
    const { user } = useContext(StateContext);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passReEntry, setPassReEntry] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    // const [profilePic, setProfilePic] = useState("");
    const [oauthProvider, setOauthProvider] = useState(OauthProvider.Github);
    const [loading, setLoading] = useState(true);

    const alert = useAlert()

    useEffect(() => {
      setColor(BgColor.White);

      if (linkToken && linkUid) {
        WebService.validateToken({
          uidb64: linkUid,
          token: linkToken,
        }).subscribe(async (data) => {
          if (data.ok) {
            const user = await data.json();
            setUserData(user);
            setLoading(false);
          } else {
            const error = await data.json();
            console.log(error);
            alert.error(error.non_field_errors[0]);
            setLoading(false);
          }
        });
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const modify = (e: any) => {
      e.preventDefault()
      if (formIsComplete()) {
        if (validateEmail(email)) {
          if (password === passReEntry) {
            // if (validatePasswordLength(password)) {
            //   if (containsSpecialCharacters(password)) {
            //     if (containsUpperCase(password)) {
            //       if (containsLowerCase(password)) {
            //         if (containsNumber(password)) {
                      const updatedUser = {
                        username: email,
                        email: email,
                        password: password,
                        first_name: firstName,
                        last_name: lastName,
                      }
                      WebService.modifyUser(updatedUser, getUserId(user))
                        .subscribe(async (data) => {
                          if (data.ok) {
                            WebService.modifyDelegate({
                              oauth_provider: oauthProvider,
                            }, getDelegateId(user))
                              .subscribe(async (data) => {
                                if (data.ok) {
                                  // redirect to 3rd party oauth app
                                  if (oauthProvider === OauthProvider.Github) {
                                    const stateUUID = uuid();
                                    sessionStorage.setItem("oauthState", stateUUID);
                                    window.location.href =
                                      'https://github.com/login/oauth/authorize?client_id='
                                      + github_client_id
                                      + '&redirect_uri=https://voice.radicalxchange.org/oauth2/callback&state='
                                      + stateUUID;
                                  } else if (oauthProvider === OauthProvider.Twitter) {
                                    WebService.getTwitterRequestToken()
                                      .subscribe(async (data) => {
                                          sessionStorage.setItem("oauthState", data.oauth_token);
                                          sessionStorage.setItem("twitterOauthSecret", data.oauth_secret);
                                          window.location.href =
                                            'https://api.twitter.com/oauth/authenticate?oauth_token='
                                            + data.oauth_token;
                                        }
                                      );
                                  }
                                } else {
                                  console.error("Error", await data.json());
                                }
                              });
                          } else {
                            console.error("Error", await data.json());
                          }
                        });
            //         } else {
            //           alert.error("Password must contain at least one number")
            //         }
            //       } else {
            //         alert.error("Password must contain at least one lower case character")
            //       }
            //     } else {
            //       alert.error("Password must contain at least one upper case character")
            //     }
            //   } else {
            //     alert.error("Password must contain at least 1 special character")
            //   }
            // } else {
            //   alert.error("Password length must be at least 8 characters")
            // }
          } else {
            alert.error("Re-entered password does not match")
          }
        } else {
          alert.error("Please enter a valid email address")
        }
      } else {
        alert.error("Please fill all the fields")
      }
    };

    const formIsComplete = () => {
      if (firstName && lastName && email && password && passReEntry) {
        return true;
      }
      return false;
    };

  if (loading) {
    return (
      <h2>loading...</h2>
    );
  } else if (!user) {
    return (
      <h2>Sorry! This activation link is invalid or expired.</h2>
    );
  } else {
    return (
      <form className="create-account" onSubmit={modify}>
        <img src={logo} className="App-logo" alt="logo" />
        <p>Create your account to participate in the democratic process!</p>

        <input
          type="text"
          placeholder="First Name"
          className="login-input"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Last Name"
          className="login-input"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Email"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Re-Enter Password"
          className="login-input"
          value={passReEntry}
          onChange={(e) => setPassReEntry(e.target.value)}
        />

        <p className="oauth-message">Login to either a Github or Twitter account to verify your identity. We will not access any information on your third-party account other than your username.</p>
        <select
          className="oauth-provider"
          id="select-oauth-provider"
          onChange={(e) => setOauthProvider(oauthProvider => {
            switch (e.target.value) {
              case OauthProvider.Github: {
                return OauthProvider.Github;
              }
              case OauthProvider.Twitter: {
                return OauthProvider.Twitter;
              }
              default: {
                return OauthProvider.Github;
              }
            }
          })}
        >
          <option value={OauthProvider.Github}>Verify with Github</option>
          <option value={OauthProvider.Twitter}>Verify with Twitter</option>
        </select>

        <button
          type="submit"
          className="create-account-button"
          >
          create account
        </button>
      </form>
    );
  }
}

export default ValidationPage;
