"use client";
import { Divider, Typography } from 'antd';

const {Text, Link} = Typography;

export default function NotFound({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const clarificationBlock = slug ? (
    <div>
      Selected bundleId <Text code>{slug}</Text> does not exist in the database.
    </div>
  ) : null;

  return (
    <div>
      <h1>Oops! Application not found</h1>
      {clarificationBlock}
      <Divider/>
      <Link href="/">All supported applications</Link>
    </div>
  )
}
