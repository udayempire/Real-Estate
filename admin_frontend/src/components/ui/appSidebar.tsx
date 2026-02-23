"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
} from "@/components/ui/sidebar"

import {
    Building2,
    Calendar,
    ClipboardList,
    Image,
    UserCog,
    WalletIcon,
    ChevronDown,
    Users2,
    User,
    OctagonMinus,
    Crown,
    BarChart2,
    Home,
} from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

const items = [
    { title: "Dashboard", url: "/dashboard", icon: BarChart2 },
    {
        title: "Property Management",
        url: "#",
        icon: Building2,
        children: [
            { title: "All Listings", url: "/properties/all", icon: Home },
            { title: "Exclusive Approval", url: "/properties/exclusive", icon:Crown },
        ],
    },
    {
        title: "User Management",
        url: "#",
        icon: User,
        children: [
            { title: "All Users", url: "/users/all", icon:Users2 },
            { title: "Blocked Users", url: "/users/blocked", icon: OctagonMinus },
        ],
    },
    { title: "Appointments", url: "#", icon: Calendar },
    { title: "Requirement Board", url: "#", icon: ClipboardList },
    { title: "Financials", url: "#", icon: WalletIcon },
    { title: "Banner Management", url: "/banner-management", icon: Image },
    { title: "Role Management", url: "/role-management", icon: UserCog },
]

export const AppSidebar = () => {
    return (
        <Sidebar className="top-18! h-[calc(100svh-4.5rem)]!">
            <SidebarHeader />

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel></SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>

                            {items.map((item) =>
                                item.children ? (
                                    <Collapsible key={item.title} className="group/collapsible">
                                        {/* Parent Item */}
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton
                                                    className="text-[16px] font-medium text-gray-600 h-12 w-3xs hover:bg-blue-100 hover:text-blue-500 cursor-pointer"
                                                >
                                                    <item.icon className="size-5!" />
                                                    <span>{item.title}</span>
                                                    <ChevronDown className="size-4! transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                        </SidebarMenuItem>

                                        {/* Children */}
                                        <CollapsibleContent>
                                            {item.children.map((child) => {
                                                const ChildIcon = "icon" in child ? child.icon : null
                                                return (
                                                    <SidebarMenuItem
                                                        key={child.title}
                                                        className="pl-8"
                                                    >
                                                        <SidebarMenuButton
                                                            asChild
                                                            className="text-[16px] font-medium text-gray-600 h-12 w-3xs hover:bg-blue-100 hover:text-blue-500"
                                                        >
                                                            <a href={child.url}>
                                                                {ChildIcon && <ChildIcon className="size-5!" />}
                                                                <span>{child.title}</span>
                                                            </a>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                )
                                            })}
                                        </CollapsibleContent>
                                    </Collapsible>
                                ) : (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            className="text-[16px] font-medium text-gray-600 h-12 w-3xs hover:bg-blue-100 hover:text-blue-500"
                                        >
                                            <a href={item.url}>
                                                <item.icon className="size-5!" />
                                                <span>{item.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            )}

                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}