import React, { useContext, useState, useEffect } from "react";
import { Alert, Button, Form, Row, Col, Stack } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";

import backgroundImage from "../assets/backgroundl1.jpg"; // Import the background image

const Login = () => {
    const { loginUser, loginError, loginInfo, updateLoginInfo, isLoginLoading } = useContext(AuthContext);
    const [colorIndex, setColorIndex] = useState(0);
    const colors = ["red", "gold", "orange", "yellow"];

    useEffect(() => {
        const interval = setInterval(() => {
            setColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
        }, 1000); 

        return () => clearInterval(interval); // Clean up the interval
    }, []);

    const currentColor = colors[colorIndex];

    return (
        <>
            <Form onSubmit={loginUser}>
                <Row style={{
                    height: "80vh",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundImage: `url(${backgroundImage})`, // Corrected
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}>
                    <Col xs={6}>
                        <Stack gap={3} style={{ display: "flex", alignItems: "center" }}>
                            <h2 style={{ color: "white" }}>Login</h2>
                            <Form.Control
                                type="email"
                                placeholder="Email"
                                onChange={(e) =>
                                    updateLoginInfo({ ...loginInfo, email: e.target.value })
                                }
                                style={{ height: "30px", fontSize: "14px", width: "80%", justifyContent: "center" }}
                            />
                            <Form.Control
                                type="password"
                                placeholder="Password"
                                onChange={(e) =>
                                    updateLoginInfo({ ...loginInfo, password: e.target.value })
                                }
                                style={{ height: "30px", fontSize: "14px", width: "80%", justifyContent: "center" }}
                            />
                            <Button variant="primary" type="submit" className="highlight-animation">
                                {isLoginLoading ? "Getting you in ..." : "Login"}
                            </Button>
                            {loginError?.error && (<Alert variant="danger">
                                <p>{loginError?.message}</p>
                            </Alert>)}
                        </Stack>
                    </Col>
                </Row>
            </Form>
            <div style={{ textAlign: "center", marginTop: "20px", color: currentColor, fontWeight: "bold", fontSize: "1.2rem" }}>
             
            </div>
        </>
    );
};

export default Login;
