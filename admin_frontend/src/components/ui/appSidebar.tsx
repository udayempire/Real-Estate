"use client"

import { Fragment } from "react"
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
    LucideTickets,
    Clock4Icon,
    Watch,
    WalletCardsIcon,
    Hammer,
} from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { RequireRole } from "@/components/auth/RequireRole"

const items = [
    { title: "Dashboard", url: "/dashboard", icon: BarChart2, roles: ["SUPER_ADMIN","ADMIN"] as const },
    {
        title: "Property Management",
        url: "#",
        icon: Building2,
        roles: ["SUPER_ADMIN","ADMIN"] as const,
        children: [
            { title: "User's Listings", url: "/property/all-listings", icon: Home },
            { title: "Exclusive Listings", url: "/property/exclusive-listings", icon: Crown },
            { title: "Pending Approvals", url: "/property/pending-approvals", icon: Clock4Icon, roles: ["SUPER_ADMIN","ADMIN"] as const },
        ],
    },
    {
        title: "User Management",
        url: "#",
        icon: User,
        roles: ["SUPER_ADMIN","ADMIN"] as const,
        children: [
            { title: "All Users", url: "/user-management/all-users", icon: Users2 },
            { title: "Blocked Users", url: "/user-management/blocked-users", icon: OctagonMinus },
            { title: "Ban Requests", url: "/user-management/ban-requests", icon: Hammer },
        ],
    },
    { title: "Appointments", url: "/appointments", icon: Calendar, roles: ["SUPER_ADMIN","ADMIN"] as const },
    { title: "Requirement Board", url: "/requirement-board", icon: ClipboardList, roles: ["SUPER_ADMIN","ADMIN"] as const },
    { title: "Financials", url: "#", icon: WalletIcon, roles: ["SUPER_ADMIN","ADMIN"] as const, children: [
        { title: "Manage Transactions", url: "/financials", icon: WalletCardsIcon },
        { title: "Gem Approvals", url: "/financials/gem-approvals", icon: Watch, roles: ["SUPER_ADMIN","ADMIN"] as const },
    ] },
    { title: "Banner Management", url: "/banner-management", icon: Image, roles: ["SUPER_ADMIN","ADMIN"] as const },
    { title: "Support Tickets", url: "/support-tickets", icon: LucideTickets, roles: ["CUSTOMER_SUPPORT","SUPER_ADMIN","ADMIN"] as const },
    { title: "Role Management", url: "/role-management", icon: UserCog, roles: ["SUPER_ADMIN"] as const },
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
                                    <Fragment key={item.title}>
                                        {("roles" in item && item.roles) ? (
                                            <RequireRole roles={[...item.roles]}>
                                                <Collapsible className="group/collapsible">
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
                                                            const childRoles = "roles" in child ? child.roles : null
                                                            const link = (
                                                                <SidebarMenuItem
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
                                                            return childRoles ? (
                                                                <RequireRole key={child.title} roles={[...childRoles]}>
                                                                    {link}
                                                                </RequireRole>
                                                            ) : (
                                                                <Fragment key={child.title}>{link}</Fragment>
                                                            )
                                                        })}
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            </RequireRole>
                                        ) : (
                                            <Collapsible className="group/collapsible">
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
                                                        const childRoles = "roles" in child ? child.roles : null
                                                        const link = (
                                                            <SidebarMenuItem
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
                                                        return childRoles ? (
                                                            <RequireRole key={child.title} roles={[...childRoles]}>
                                                                {link}
                                                            </RequireRole>
                                                        ) : (
                                                            <Fragment key={child.title}>{link}</Fragment>
                                                        )
                                                    })}
                                                </CollapsibleContent>
                                            </Collapsible>
                                        )}
                                    </Fragment>
                                ) : "roles" in item && item.roles ? (
                                    <RequireRole key={item.title} roles={[...item.roles]}>
                                        <SidebarMenuItem>
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
                                    </RequireRole>
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
