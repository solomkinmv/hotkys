import React from "react";
import "./App.css";
import { Outlet } from "react-router-dom";
import { ConfigProvider, Menu, MenuProps } from "antd";

const headerMenu: MenuProps["items"] = [
    {
        key: "home",
        label: "Home"
    },
    {
        key: "about",
        label: "About"
    }
]

function App() {
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
                <div><Menu mode="horizontal" items={headerMenu} /></div>
                <Outlet />
                <div>Footer</div>
            </div>
        </ConfigProvider>
    );
}

export default App;
