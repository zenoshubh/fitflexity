"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import withAuth from "@/components/withAuth";
import axios from "axios";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Loader from "@/components/Loader";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import Male_10percent from "@/assets/Male_lessThan10percent.png";
import Male_11To18percent from "@/assets/Male_11To18percent.png";
import Male_19To25percent from "@/assets/Male_19To25percent.png";
import Male_moreThan26percent from "@/assets/Male_moreThan26percent.png";
import { Label } from "@/components/ui/label";

// Zod enums

const genderEnum = z.enum(["male", "female", "other"]);

const activityLevelEnum = z.enum([
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "super_active",
]);

const bodyFatPercentageEnum = z.enum([
  "less_than_10",
  "between_11_and_18",
  "between_19_and_25",
  "more_than_26",
]);

const formSchema = z.object({
  dateOfBirth: z.string().min(1, { message: "Date of birth is required." }),
  weightInKgs: z
    .number()
    .min(10, { message: "Weight must be at least 10 kg." }),
  heightInCms: z
    .number()
    .min(50, { message: "Height must be at least 50 cm." }),
  bodyFatPercentage: bodyFatPercentageEnum,
  activityLevel: activityLevelEnum,
  gender: genderEnum,
});

const bodyFatOptions = [
  {
    value: "less_than_10",
    img: Male_10percent,
    label: "<10%",
  },
  {
    value: "between_11_and_18",
    img: Male_11To18percent,
    label: "11-18%",
  },
  {
    value: "between_19_and_25",
    img: Male_19To25percent,
    label: "19-25%",
  },
  {
    value: "more_than_26",
    img: Male_moreThan26percent,
    label: ">26%",
  },
];



const CompleteProfilePage = () => {
  const { user } = useAuth();

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateOfBirth: "",
      weightInKgs: 0,
      heightInCms: 0,
      bodyFatPercentage: "between_19_and_25", // was empty string
      activityLevel: "lightly_active", // was undefined
      gender: "male", // was undefined
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await api.post("/users/complete-profile", values, {
        withCredentials: true,
      });
      const { status, data, message } = response.data;
      if (status == 200) {
        toast.success(message || "Profile completed successfully");
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "An error occurred");
    }
  }

  useEffect(() => {
    if (user?.isProfileComplete) {
      router.push("/dashboard");
    }
  }, [user, router]);

  return user?.isProfileComplete ? (
    <Loader />
  ) : (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <FormControl>
                <RadioGroup
                  className="flex gap-4"
                  defaultValue={field.value}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <RadioGroupItem
                    value="male"
                    id="gender-male"
                  />
                  <Label htmlFor="gender-male">Male</Label>
                  <RadioGroupItem
                    value="female"
                    id="gender-female"
                  />
                  <Label htmlFor="gender-female">Female</Label>
                  <RadioGroupItem
                    value="other"
                    id="gender-other"
                  />
                  <Label htmlFor="gender-other">Other</Label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weightInKgs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (kg)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="heightInCms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Height (cm)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bodyFatPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body Fat Percentage</FormLabel>
              <FormControl>
                <RadioGroup
                  className="flex gap-4"
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  {bodyFatOptions.map((option) => {
                    const checked = field.value === option.value;
                    return (
                      <RadioGroupItem
                        key={option.value}
                        value={option.value}
                        id={`bodyfat-${option.value}`}
                        className="sr-only"
                      />
                    );
                  })}
                  {bodyFatOptions.map((option) => {
                    const checked = field.value === option.value;
                    return (
                      <label
                        key={option.value}
                        htmlFor={`bodyfat-${option.value}`}
                        className={`flex flex-col items-center cursor-pointer border rounded-lg p-2 transition
                          ${
                            checked
                              ? "ring-2 ring-primary border-primary"
                              : "border-muted"
                          }
                        `}
                        tabIndex={0}
                      >
                        <Image
                          src={option.img}
                          alt={option.label}
                          width={80}
                          height={80}
                          className="rounded mb-2"
                        />
                        <span className="text-xs">{option.label}</span>
                      </label>
                    );
                  })}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="activityLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Level</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="lightly_active">Lightly Active</SelectItem>
                  <SelectItem value="moderately_active">
                    Moderately Active
                  </SelectItem>
                  <SelectItem value="very_active">Very Active</SelectItem>
                  <SelectItem value="super_active">Super Active</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};

export default withAuth(CompleteProfilePage);
