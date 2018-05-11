# IoT support buttons (POC)
Lambda function to integrate AWS IoT Button events with a support service.



### Environment variables

```
SES_FROM - email notification sender
```



### Configuration

source/iot-support-buttons/conf.json

```json
{
  "IOTBUTTON_SERIAL": {
    "location": "Stockholm Office",
    "email": "support@company.com",
    "emailSubject": "Support request",
    "teamsWebHook": "https://outlook.office.com/webhook/..."
  }
}

```

