import { Link, useParams } from "react-router-dom";
import { Divider, Typography } from 'antd';

const {Text} = Typography;

export default function AppNotFound() {
    let {slug} = useParams();

    const clarificationBlock = slug ? (
        <div>
            Selected bundleId <Text code>{slug}</Text> doesn't exist in the database.
        </div>
    ) : null;

    return (
        <div>
            <h1>Oops! Application not found</h1>
            {clarificationBlock}
            <Divider/>
            <Link to="/">All supported applications</Link>
        </div>
    )
}
