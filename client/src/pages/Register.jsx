import React, { useContext } from "react";
import { Alert, Button, Form, Row, Col, Stack } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";

import backgroundImage from "../assets/bg.jpg"; // Import the background image
import registerImage from "../assets/robot.gif"; // Import your image

const Register = () => {
    const {
        registerInfo,
        updateRegisterInfo,
        registerUser,
        registerError,
        isRegisterLoading,
    } = useContext(AuthContext);

    return (
        <>
            <Form onSubmit={registerUser}>
                <Row
                    style={{
                        height: "100vh",
                        justifyContent: "center",
                        paddingTop: "10%",
                        backgroundImage: `url(${backgroundImage})`, // Corrected
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    <Col xs={6}>
                        <Stack gap={3} style={{ display: "flex", alignItems: "center", color: "white" }}>
                            <h2>Register</h2>
                            <Form.Control
                                type="text"
                                style={{ height: "30px", fontSize: "14px", width: "80%", justifyContent: "center" }}
                                placeholder="Name"
                                onChange={(e) =>
                                    updateRegisterInfo({ ...registerInfo, name: e.target.value })
                                }
                            />
                            <Form.Control
                                type="email"
                                style={{ height: "30px", fontSize: "14px", width: "80%", justifyContent: "center" }}
                                placeholder="Email"
                                onChange={(e) =>
                                    updateRegisterInfo({ ...registerInfo, email: e.target.value })
                                }
                            />
                            <Form.Control
                                type="password"
                                style={{ height: "30px", fontSize: "14px", width: "80%", justifyContent: "center" }}
                                placeholder="Password"
                                onChange={(e) =>
                                    updateRegisterInfo({ ...registerInfo, password: e.target.value })
                                }
                            />
                            <Button
                                variant="primary"
                                type="submit"
                                className={`highlight-animation ${isRegisterLoading ? 'disabled' : ''}`} // Corrected
                                style={{ height: "30px", fontSize: "14px", width: "20%" }}
                            >
                                {isRegisterLoading ? "Creating Your account" : "Register"}
                            </Button>
                            {registerError?.error && (
                                <Alert variant="danger">
                                    <p>{registerError?.message}</p>
                                </Alert>
                            )}
                        </Stack>
                    </Col>
                    <Col xs={6} className="d-flex justify-content-end">
                        <img
                            src={registerImage}
                            alt="Register Image"
                            style={{ width: "70%", borderRadius: "8px", height: "500px", marginLeft: "50px", marginRight: "100px" }} // Adjust image size and margin here
                        />
                    </Col>
                </Row>
            </Form>
        </>
    );
};

export default Register;
