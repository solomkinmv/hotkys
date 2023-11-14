import React from "react";
import "./App.css";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ConfigProvider, Divider, Menu, MenuProps, Space, Typography } from "antd";

const {Text, Link} = Typography;


const headerMenu: MenuProps["items"] = [
    {
        key: "home",
        label: "Shortcuts Disco",
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
                <div className="footer">
                    <Divider />
                    <Space split={<Divider type="vertical" />}>
                    <Text type="secondary">Made by <Link href="https://blog.solomk.in" target="_blank" color="red">Maksym Solomkin</Link></Text>
                        <Link href="https://github.com/solomkinmv/shortcuts-disco/issues" target="_blank">Report issues or make a request</Link>
                    </Space>
                </div>
            </div>
        </ConfigProvider>
    );
}

export default App;
