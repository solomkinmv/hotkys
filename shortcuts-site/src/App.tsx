import React from "react";
import "./App.css";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { ConfigProvider, Menu, MenuProps } from "antd";

const headerMenu: MenuProps["items"] = [
    {
        key: "home",
        label: "Home",
        onClick: () => <Navigate to="/" replace={true} />,
    },
    {
        key: "about",
        label: "About",
    },
];

function App() {
    const navigate = useNavigate();

    return (
        <ConfigProvider
            theme={{
                components: {
                    Layout: {
                        /* here is your component tokens */
                        headerBg: "#f5f5f5",
                        bodyBg: "#ffffff",
                        siderBg: "#f5f5f5",
                    },
                },
                // algorithm: theme.defaultAlgorithm,
                token: {
                    // Seed Token
                    // colorPrimary: "#00b96b",
                    // borderRadius: 2,

                    // Alias Token
                    // colorBgContainer: "#f6ffed",
                },
            }}
        >
            <div>
                <div>
                    <Menu mode="horizontal" items={headerMenu}
                          onClick={(event) => {
                              if (event.key === "home") {
                                  navigate("/");
                              }
                          }
                          } />
                </div>
                <Outlet />
                <div>Footer</div>
            </div>
        </ConfigProvider>
    );
}

export default App;
