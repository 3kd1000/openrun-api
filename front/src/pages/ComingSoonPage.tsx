import React from "react";

interface Props {
  title: string;
}

const ComingSoonPage: React.FC<Props> = ({ title }) => {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-140px)] p-4">
      <div className="text-center max-w-[425px]">
        <div className="text-2xl font-bold text-foreground mb-3">{title}</div>
        <p className="text-base text-muted-foreground">준비 중인 기능입니다.</p>
      </div>
    </div>
  );
};

export default ComingSoonPage;
