import React from "react";
import "./App.css";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { ConfigProvider, Divider, Menu, MenuProps, Typography } from "antd";

const {Text} = Typography;


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
                    Menu: {
                        activeBarBorderWidth: 0,
                    },
                    List: {
                        // titleMarginBottom: 1,
                        itemPadding: "12px 10px",
                    }
                },
                token: {
                },
            }}
        >
            <div className="site-body">
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
                <div>
                    <Divider />
                    <Text type="secondary">Made by Maksym Solomkin</Text>
                </div>
            </div>
        </ConfigProvider>
    );
}

export default App;
