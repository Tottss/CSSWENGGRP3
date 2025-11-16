import asyncHandler from "express-async-handler";
import { docClient } from "../config/dynamodb.js";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const updateProfile = 
