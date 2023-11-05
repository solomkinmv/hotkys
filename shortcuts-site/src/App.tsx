import React from "react";
import "./App.css";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ConfigProvider, Divider, Menu, MenuProps, Typography } from "antd";

const {Text} = Typography;


const headerMenu: MenuProps["items"] = [
    {
        key: "home",
        label: "Home",
    },
    {
        key: "about",
        label: "About",
    },
];

function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const lastPathElement = location.pathname.split("/").pop() ?? "";
    const selectedKeys = [lastPathElement === "" ? "home" : lastPathElement];

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
                    <Menu mode="horizontal"
                          items={headerMenu}
                          selectedKeys={selectedKeys}
                          onClick={(event) => {
                              if (event.key === "home") {
                                  navigate("/");
                              } else {
                                  navigate(`/${event.key}`);
                              }
                          }}/>
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
