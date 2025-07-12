'use client';
import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const Icon = ({icon = "", link = ""}) => {
    const router = useRouter();
    
        const handleClick = () => {
            router.push(link); // Navigate to the specified link
        };
    
    return (
        <button 
        className="flex items-center gap-2 px-2 py-2 bg-transparent hover:bg-[var(--button-bg-hover)] text-white rounded-lg transition-colors"
        onClick={ handleClick }>
            <Image
                src = {icon}
                alt = "Icon"
                width = {28}
                height = {28}
            />
        </button>
    );
};

export default Icon;