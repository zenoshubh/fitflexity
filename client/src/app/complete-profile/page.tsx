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

// Zod enums for bodyType and activityLevel
const bodyTypeEnum = z.enum(["ectomorph", "mesomorph", "endomorph"]);
const activityLevelEnum = z.enum([
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "super_active",
]);

const formSchema = z.object({
  dateOfBirth: z.string().min(1, { message: "Date of birth is required." }),
  weightInKgs: z
    .number()
    .min(10, { message: "Weight must be at least 10 kg." }),
  heightInCms: z
    .number()
    .min(50, { message: "Height must be at least 50 cm." }),
  bodyType: bodyTypeEnum,
  activityLevel: activityLevelEnum,
});

const CompleteProfilePage = () => {
  const { user } = useAuth();

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateOfBirth: "",
      weightInKgs: 0,
      heightInCms: 0,
      bodyType: "mesomorph", // was undefined
      activityLevel: "lightly_active", // was undefined
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await api.post("/users/complete-profile", values, {
        withCredentials: true,
      });
      // Optionally show a success message here
      router.push("/dashboard");
    } catch (error: any) {
      // Optionally show an error message here
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Failed to complete profile. Please try again.");
      }
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
          name="bodyType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select body type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ectomorph">Ectomorph</SelectItem>
                  <SelectItem value="mesomorph">Mesomorph</SelectItem>
                  <SelectItem value="endomorph">Endomorph</SelectItem>
                </SelectContent>
              </Select>
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
